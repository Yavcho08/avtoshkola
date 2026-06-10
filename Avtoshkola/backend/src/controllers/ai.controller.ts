import { Request, Response } from 'express';
import Groq from 'groq-sdk';
import { supabase } from '../config/supabase';

const DAILY_LIMIT = 10;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Ти си AI асистент за автошкола в България. Помагаш на курсистите да се подготвят за теоретичния изпит за шофьорска книжка.

Отговаряй САМО на въпроси свързани с:
- Правила за движение по пътищата в България
- Пътни знаци и маркировки
- Техническо устройство на автомобила
- Първа помощ при пътни инциденти
- Екологично и безопасно шофиране

Ако въпросът не е свързан с шофиране или теория за книжка, учтиво откажи и насочи курсиста към темата.

Отговаряй на български език. Бъди кратък, ясен и точен. Използвай примери когато е нужно.`;

export const ai = {
  async ask(req: Request, res: Response) {
    const profileId = (req as any).user.id;
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: 'Въпросът е задължителен' });
    }
    if (question.trim().length > 500) {
      return res.status(400).json({ error: 'Въпросът е твърде дълъг (макс. 500 знака)' });
    }

    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('ai_chats')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lte('created_at', `${today}T23:59:59.999Z`);

    if ((count ?? 0) >= DAILY_LIMIT) {
      return res.status(429).json({
        error: `Достигнат е дневният лимит от ${DAILY_LIMIT} въпроса. Опитай отново утре.`,
        remaining: 0,
      });
    }

    // Call Groq
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: question.trim() },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });
    const answer = completion.choices[0]?.message?.content ?? 'Няма отговор.';

    // Save to DB
    await supabase.from('ai_chats').insert({
      profile_id: profileId,
      question: question.trim(),
      answer,
    });

    const remaining = DAILY_LIMIT - (count ?? 0) - 1;
    return res.json({ data: { answer, remaining } });
  },

  async getHistory(req: Request, res: Response) {
    const profileId = (req as any).user.id;
    const today = new Date().toISOString().split('T')[0];

    const { data, count } = await supabase
      .from('ai_chats')
      .select('*', { count: 'exact' })
      .eq('profile_id', profileId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .order('created_at', { ascending: true });

    return res.json({
      data: data ?? [],
      remaining: DAILY_LIMIT - (count ?? 0),
    });
  },
};
