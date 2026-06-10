import { Request, Response } from 'express';
import Groq from 'groq-sdk';
import { supabase } from '../config/supabase';

const DAILY_LIMIT = 3;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const QUESTION_TOPICS = [
  'пътни знаци', 'правила за движение', 'предимство на кръстовище',
  'скоростни ограничения', 'паркиране', 'изпреварване', 'светофари',
  'пешеходни пътеки', 'техническа неизправност', 'първа помощ при ПТП',
  'алкохол и шофиране', 'маркировки по пътя', 'движение на магистрала',
];

export interface ExamQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export const examSim = {
  async generate(req: Request, res: Response) {
    const profileId = (req as any).user.id;

    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('exam_simulations')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .gte('created_at', `${today}T00:00:00.000Z`);

    if ((count ?? 0) >= DAILY_LIMIT) {
      return res.status(429).json({
        error: `Достигнат е дневният лимит от ${DAILY_LIMIT} изпита. Опитай утре.`,
      });
    }

    const topics = QUESTION_TOPICS
      .sort(() => Math.random() - 0.5)
      .slice(0, 6)
      .join(', ');

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Ти си експерт по Правилника за движение по пътищата в България.
Генерирай 10 въпроса за теоретичен изпит за шофьорска книжка категория B.
Върни САМО валиден JSON обект с ключ "questions" - масив от 10 обекта.
Всеки обект задължително има:
- "question": въпросът на български (string)
- "options": масив от точно 4 отговора на български (string[])
- "correct": индекс 0-3 на верния отговор (number)
- "explanation": кратко обяснение защо отговорът е верен (string, макс 2 изречения)
Въпросите да са разнообразни и практически. Темите: ${topics}.`,
        },
        { role: 'user', content: 'Генерирай изпита.' },
      ],
      max_tokens: 3000,
      temperature: 0.8,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let questions: ExamQuestion[];
    try {
      const parsed = JSON.parse(raw);
      questions = parsed.questions ?? parsed;
      if (!Array.isArray(questions) || questions.length < 5) {
        throw new Error('Invalid questions format');
      }
      // Ensure exactly 10
      questions = questions.slice(0, 10);
    } catch {
      return res.status(500).json({ error: 'Грешка при генериране на въпроси. Опитай отново.' });
    }

    return res.json({ data: { questions, remaining: DAILY_LIMIT - (count ?? 0) - 1 } });
  },

  async submit(req: Request, res: Response) {
    const profileId = (req as any).user.id;
    const { questions, answers } = req.body as {
      questions: ExamQuestion[];
      answers: number[]; // index of chosen option per question
    };

    if (!Array.isArray(questions) || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Невалидни данни.' });
    }

    // Calculate score and find wrong answers
    const score = questions.reduce((s, q, i) => s + (answers[i] === q.correct ? 1 : 0), 0);
    const wrongQuestions = questions
      .map((q, i) => ({ ...q, chosen: answers[i] }))
      .filter((_, i) => answers[i] !== questions[i].correct);

    // Generate personalized feedback from AI
    let feedback = '';
    if (wrongQuestions.length > 0) {
      const wrongSummary = wrongQuestions
        .slice(0, 5)
        .map(q => `- Въпрос: "${q.question}" — избра: "${q.options[q.chosen]}", вярно: "${q.options[q.correct]}"`)
        .join('\n');

      const fbCompletion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Ти си инструктор по шофьорска книжка в България. Пиши на български. Бъди кратък и насърчаващ.',
          },
          {
            role: 'user',
            content: `Курсистът получи ${score}/10 на симулационен изпит. Сгрешени въпроси:\n${wrongSummary}\n\nДай кратка персонализирана препоръка (2-3 изречения) какво да учи и как да се подобри. Не изброявай въпросите отново.`,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });
      feedback = fbCompletion.choices[0]?.message?.content ?? '';
    } else {
      feedback = 'Отличен резултат! Перфектно си усвоил материала. Продължавай така!';
    }

    // Save to DB
    const { data: saved } = await supabase
      .from('exam_simulations')
      .insert({ profile_id: profileId, questions, answers, score, feedback })
      .select()
      .single();

    return res.json({ data: { id: saved?.id, score, total: questions.length, feedback, wrongQuestions } });
  },

  async getHistory(req: Request, res: Response) {
    const profileId = (req as any).user.id;

    const { data } = await supabase
      .from('exam_simulations')
      .select('id, score, feedback, created_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Daily remaining
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('exam_simulations')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .gte('created_at', `${today}T00:00:00.000Z`);

    return res.json({ data: data ?? [], remaining: DAILY_LIMIT - (count ?? 0) });
  },
};
