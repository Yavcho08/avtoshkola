"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.examSim = void 0;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const supabase_1 = require("../config/supabase");
const DAILY_LIMIT = 3;
const groq = new groq_sdk_1.default({ apiKey: process.env.GROQ_API_KEY });
exports.examSim = {
    async generate(req, res) {
        const profileId = req.user.id;
        const today = new Date().toISOString().split('T')[0];
        const { count } = await supabase_1.supabase
            .from('exam_simulations')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profileId)
            .gte('created_at', `${today}T00:00:00.000Z`);
        if ((count ?? 0) >= DAILY_LIMIT) {
            return res.status(429).json({
                error: `Достигнат е дневният лимит от ${DAILY_LIMIT} изпита. Опитай утре.`,
            });
        }
        // Fetch real questions from avtoizpit.com
        let rawQuestions = [];
        try {
            const resp = await fetch('https://avtoizpit.com/api/test-sets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ languageId: 1, subCategoryId: 3, learningPlanId: 226 }),
            });
            if (!resp.ok)
                throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            rawQuestions = (data.questions ?? data);
        }
        catch {
            return res.status(500).json({ error: 'Грешка при зареждане на въпросите от avtoizpit.com. Опитай отново.' });
        }
        if (!Array.isArray(rawQuestions) || rawQuestions.length < 5) {
            return res.status(500).json({ error: 'Недостатъчно въпроси. Опитай отново.' });
        }
        // Keep only single-correct-answer questions with 4 text answers
        const usable = rawQuestions.filter(q => q.text?.trim() &&
            q.correctAnswersCount === 1 &&
            Array.isArray(q.answers) &&
            q.answers.length >= 4 &&
            q.answers.slice(0, 4).every(a => a.text?.trim()));
        const shuffled = usable.sort(() => Math.random() - 0.5).slice(0, 10);
        if (shuffled.length < 5) {
            return res.status(500).json({ error: 'Недостатъчно подходящи въпроси. Опитай отново.' });
        }
        // Ask Groq to identify correct answers + explanations in one batch
        const questionsText = shuffled.map((q, i) => {
            const opts = q.answers.slice(0, 4).map((a, j) => `  ${j}. ${a.text}`).join('\n');
            return `Въпрос ${i + 1}: ${q.text}\n${opts}`;
        }).join('\n\n');
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: `Ти си експерт по Закона за движение по пътищата (ЗДвП) и Правилника за прилагането му (ППЗДвП) в България.
Получаваш ${shuffled.length} въпроса от официален изпит за шофьорска книжка категория B. Всеки има 4 варианта (0, 1, 2, 3).
За всеки въпрос:
1. Определи кой вариант е ВЕРЕН (само един).
2. Дай кратко обяснение на български (1-2 изречения) защо е верен.
Върни САМО валиден JSON обект: {"answers": [{"correct": 0, "explanation": "..."}, ...]}
Масивът трябва да има точно ${shuffled.length} елемента в същия ред.`,
                },
                { role: 'user', content: questionsText },
            ],
            max_tokens: 2500,
            temperature: 0.1,
        });
        let graded;
        try {
            const parsed = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
            graded = parsed.answers;
            if (!Array.isArray(graded) || graded.length !== shuffled.length) {
                throw new Error('Unexpected format');
            }
        }
        catch {
            return res.status(500).json({ error: 'Грешка при обработка на въпросите. Опитай отново.' });
        }
        const questions = shuffled.map((q, i) => {
            const correct = Math.max(0, Math.min(3, Number(graded[i]?.correct) || 0));
            return {
                question: q.text,
                options: q.answers.slice(0, 4).map(a => a.text),
                correct,
                explanation: graded[i]?.explanation ?? '',
                ...(q.pictureId
                    ? { pictureUrl: `https://avtoizpit.com/api/pictures/${q.pictureId}.png?quality=1` }
                    : {}),
            };
        });
        return res.json({ data: { questions, remaining: DAILY_LIMIT - (count ?? 0) - 1 } });
    },
    async submit(req, res) {
        const profileId = req.user.id;
        const { questions, answers } = req.body;
        if (!Array.isArray(questions) || !Array.isArray(answers)) {
            return res.status(400).json({ error: 'Невалидни данни.' });
        }
        const score = questions.reduce((s, q, i) => s + (answers[i] === q.correct ? 1 : 0), 0);
        const wrongQuestions = questions
            .map((q, i) => ({ ...q, chosen: answers[i] }))
            .filter((_, i) => answers[i] !== questions[i].correct);
        let feedback = '';
        if (wrongQuestions.length > 0) {
            const wrongSummary = wrongQuestions
                .slice(0, 5)
                .map(q => `- "${q.question}" → избра: "${q.options[q.chosen]}", вярно: "${q.options[q.correct]}"`)
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
                        content: `Курсистът получи ${score}/10. Сгрешени въпроси:\n${wrongSummary}\n\nДай кратка персонализирана препоръка (2-3 изречения) какво да учи. Не изброявай въпросите.`,
                    },
                ],
                max_tokens: 300,
                temperature: 0.7,
            });
            feedback = fbCompletion.choices[0]?.message?.content ?? '';
        }
        else {
            feedback = 'Отличен резултат! Перфектно си усвоил материала. Продължавай така!';
        }
        const { data: saved } = await supabase_1.supabase
            .from('exam_simulations')
            .insert({ profile_id: profileId, questions, answers, score, feedback })
            .select()
            .single();
        return res.json({ data: { id: saved?.id, score, total: questions.length, feedback, wrongQuestions } });
    },
    async getHistory(req, res) {
        const profileId = req.user.id;
        const { data } = await supabase_1.supabase
            .from('exam_simulations')
            .select('id, score, feedback, created_at')
            .eq('profile_id', profileId)
            .order('created_at', { ascending: false })
            .limit(20);
        const today = new Date().toISOString().split('T')[0];
        const { count } = await supabase_1.supabase
            .from('exam_simulations')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profileId)
            .gte('created_at', `${today}T00:00:00.000Z`);
        return res.json({ data: data ?? [], remaining: DAILY_LIMIT - (count ?? 0) });
    },
};
//# sourceMappingURL=exam-sim.controller.js.map