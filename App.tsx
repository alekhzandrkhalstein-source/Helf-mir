
import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- CONSTANTS ---
const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;
const PADDLE_WIDTH = 12;
const BASE_PADDLE_HEIGHT = 60;
const AI_PADDLE_HEIGHT = 60;
const BALL_SIZE = 20;
const PADDLE_MARGIN = 10;
const GOAL_HEIGHT = 160;
const INITIAL_BALL_SPEED_X = 5;
const INITIAL_BALL_SPEED_Y = 2;
const BASE_PLAYER_PADDLE_SPEED = 5;
const GAME_DURATION = 300; // 5 minutes in seconds
const TRAIL_LENGTH = 15;
const MIN_AI_SPEED = 2.0;
const MAX_AI_SPEED = 6.5;

// --- TYPES ---
type GameState = 'menu' | 'playing' | 'paused' | 'gameOver' | 'tournamentTransition';
type GameMode = 'classic' | 'tournament';
type Language = 'en' | 'de' | 'yi' | 'pl' | 'it' | 'ru' | 'ar' | 'es' | 'pt';
type AILanguage = 'ar' | 'fr' | 'ru' | Language;
type InteractionType = 'playerScore' | 'aiScore' | 'playerHit' | 'aiHit' | 'aiMiss';

interface Ripple { id: number; x: number; y: number; radius: number; opacity: number; isGoal?: boolean; }
interface Message { id: number; text: string; }
interface Shockwave { id: number; x: number; y: number; radius: number; opacity: number; thickness: number; }
interface Particle { id: number; x: number; y: number; vx: number; vy: number; life: number; size: number; }


// --- DATA ---
const translations = {
  en: { title: "Football Pong", startGame: "Start Game", paused: "Paused", resume: "Resume", gameOver: "Game Over", timesUp: "Time's Up!", youWin: "You Win!", aiWins: "AI Wins!", draw: "It's a Draw!", player: "PLAYER", ai: "AI", playAgain: "Play Again", language: "Language", difficulty: "AI Difficulty", scoreWins: "Highest score wins!", upgrades: "Upgrades", money: "Money", paddleSpeed: "Paddle Speed", paddleSize: "Paddle Size", ballPower: "Ball Power", cost: "Cost", level: "Level", gameDuration: "Game Duration", durationNote: "Will be applied on next game", settings: "Settings", restart: "Restart", playerFlag: "Player Flag", random: "Random", totalWins: "Total Wins", reset: "Reset", tournament: "Tournament", aiFlag: "AI Flag", round: "Round", tournamentChampion: "Tournament Champion!", tournamentOver: "Tournament Over", matchWon: "Match Won!", nextMatch: "Next Match", tournamentPrize: "You won $500!", madeBy: "Made by Alekhzandr Khalinski", matchLost: "Match Lost!", retryMatch: "Retry Match", livesLeft: "Lives Left: {lives}" },
  de: { title: "Fußball-Pong", startGame: "Spiel starten", paused: "Pausiert", resume: "Fortsetzen", gameOver: "Spiel vorbei", timesUp: "Zeit abgelaufen!", youWin: "Du gewinnst!", aiWins: "KI gewinnt!", draw: "Unentschieden!", player: "SPIELER", ai: "KI", playAgain: "Nochmal spielen", language: "Sprache", difficulty: "KI-Schwierigkeit", scoreWins: "Höchste Punktzahl gewinnt!", upgrades: "Upgrades", money: "Geld", paddleSpeed: "Paddel-Geschwindigkeit", paddleSize: "Paddel-Größe", ballPower: "Ballkraft", cost: "Kosten", level: "Stufe", gameDuration: "Spieldauer", durationNote: "Wird beim nächsten Spiel angewendet", settings: "Einstellungen", restart: "Neustart", playerFlag: "Spielerflagge", random: "Zufällig", totalWins: "Gesamtsiege", reset: "Zurücksetzen", tournament: "Turnier", aiFlag: "KI-Flagge", round: "Runde", tournamentChampion: "Turniersieger!", tournamentOver: "Turnier vorbei", matchWon: "Match gewonnen!", nextMatch: "Nächstes Match", tournamentPrize: "Du hast $500 gewonnen!", madeBy: "Erstellt von Alekhzandr Khalinski", matchLost: "Match verloren!", retryMatch: "Match wiederholen", livesLeft: "Leben übrig: {lives}" },
  yi: { title: "פוטבאָל פּאָנג", startGame: "אָנהייב שפּיל", paused: "פּאָזד", resume: "פאָרזעצן", gameOver: "שפּיל איבער", timesUp: "צייט איז ארויף!", youWin: "איר געווינט!", aiWins: "AI געווינט!", draw: "א ציען!", player: "שפּילער", ai: "AI", playAgain: "שפּיל ווידער", language: "שפּראַך", difficulty: "AI שוועריקייט", scoreWins: "העכסטן כעזשבן ווינס!", upgrades: "אַפּגריידז", money: "געלט", paddleSpeed: "פּאַדל גיכקייַט", paddleSize: "פּאַדל גרייס", ballPower: "פּילקע מאַכט", cost: "פּרייַז", level: "LEVEL", gameDuration: "שפּיל געדויער", durationNote: "וועט צולייגן אויף ווייַטער שפּיל", settings: "סעטטינגס", restart: "ריסטאַרט", playerFlag: "שפּילער פאָן", random: "ראַנדאָם", totalWins: "גאַנץ ווינס", reset: "באַשטעטיק", tournament: "טורנאַמאַנט", aiFlag: "AI פאָן", round: "קייַלעכיק", tournamentChampion: "טורנאַמאַנט מייַסטער!", tournamentOver: "טורנאַמאַנט איבער", matchWon: "גלייַכן וואַן!", nextMatch: "ווייַטער גלייַכן", tournamentPrize: "איר וואַן $500!", madeBy: "געמאכט דורך Alekhzandr Khalinski", matchLost: "גלייַכן פאַרפאַלן!", retryMatch: "פּרובירן ווידער", livesLeft: "לעבנס לינקס: {lives}" },
  pl: { title: "Piłkarski Pong", startGame: "Rozpocznij grę", paused: "Pauza", resume: "Wznów", gameOver: "Koniec gry", timesUp: "Czas minął!", youWin: "Wygrywasz!", aiWins: "AI wygrywa!", draw: "Remis!", player: "GRACZ", ai: "AI", playAgain: "Zagraj ponownie", language: "Język", difficulty: "Poziom trudności AI", scoreWins: "Najwyższy wynik wygrywa!", upgrades: "Ulepszenia", money: "Pieniądze", paddleSpeed: "Prędkość paletki", paddleSize: "Rozmiar paletki", ballPower: "Moc piłki", cost: "Koszt", level: "Poziom", gameDuration: "Czas gry", durationNote: "Zostanie zastosowane w następnej grze", settings: "Ustawienia", restart: "Restart", playerFlag: "Flaga gracza", random: "Losowy", totalWins: "Całkowite wygrane", reset: "Resetuj", tournament: "Turniej", aiFlag: "Flaga AI", round: "Runda", tournamentChampion: "Mistrz Turnieju!", tournamentOver: "Turniej zakończony", matchWon: "Mecz wygrany!", nextMatch: "Następny mecz", tournamentPrize: "Wygrałeś $500!", madeBy: "Stworzone przez Alekhzandr Khalinski", matchLost: "Mecz przegrany!", retryMatch: "Spróbuj ponownie", livesLeft: "Pozostałe życia: {lives}" },
  it: { title: "Pong di Calcio", startGame: "Inizia il Gioco", paused: "In pausa", resume: "Riprendi", gameOver: "Fine del gioco", timesUp: "Tempo scaduto!", youWin: "Hai vinto!", aiWins: "L'IA vince!", draw: "Pareggio!", player: "GIOCATORE", ai: "IA", playAgain: "Gioca di nuovo", language: "Lingua", difficulty: "Difficoltà IA", scoreWins: "Vince il punteggio più alto!", upgrades: "Aggiornamenti", money: "Soldi", paddleSpeed: "Velocità racchetta", paddleSize: "Dimensione racchetta", ballPower: "Potenza palla", cost: "Costo", level: "Livello", gameDuration: "Durata del gioco", durationNote: "Si applicherà alla prossima partita", settings: "Impostazioni", restart: "Ricomincia", playerFlag: "Bandiera del giocatore", random: "Casuale", totalWins: "Vittorie totali", reset: "Ripristina", tournament: "Torneo", aiFlag: "Bandiera IA", round: "Turno", tournamentChampion: "Campione del Torneo!", tournamentOver: "Torneo finito", matchWon: "Partita Vinta!", nextMatch: "Prossima partita", tournamentPrize: "Hai vinto $500!", madeBy: "Creato da Alekhzandr Khalinski", matchLost: "Partita Persa!", retryMatch: "Riprova", livesLeft: "Vite rimaste: {lives}" },
  ru: { title: "Футбольный Понг", startGame: "Начать игру", paused: "Пауза", resume: "Продолжить", gameOver: "Игра окончена", timesUp: "Время вышло!", youWin: "Вы победили!", aiWins: "ИИ победил!", draw: "Ничья!", player: "ИГРОК", ai: "ИИ", playAgain: "Играть снова", language: "Язык", difficulty: "Сложность ИИ", scoreWins: "Побеждает лучший счет!", upgrades: "Улучшения", money: "Деньги", paddleSpeed: "Скорость ракетки", paddleSize: "Размер ракетки", ballPower: "Сила мяча", cost: "Стоимость", level: "Уровень", gameDuration: "Длительность игры", durationNote: "Применится в следующей игре", settings: "Настройки", restart: "Перезапуск", playerFlag: "Флаг игрока", random: "Случайный", totalWins: "Всего побед", reset: "Сброс", tournament: "Турнир", aiFlag: "Флаг ИИ", round: "Раунд", tournamentChampion: "Чемпион турнира!", tournamentOver: "Турнир окончен", matchWon: "Матч выигран!", nextMatch: "Следующий матч", tournamentPrize: "Вы выиграли $500!", madeBy: "Сделано Александром Халинским", matchLost: "Матч проигран!", retryMatch: "Повторить", livesLeft: "Осталось жизней: {lives}" },
  ar: { title: "بونج كرة القدم", startGame: "ابدأ اللعبة", paused: "متوقف مؤقتا", resume: "استئناف", gameOver: "انتهت اللعبة", timesUp: "انتهى الوقت!", youWin: "لقد فزت!", aiWins: "فاز الذكاء الاصطناعي!", draw: "تعادل!", player: "لاعب", ai: "الذكاء الاصطناعي", playAgain: "العب مرة أخرى", language: "لغة", difficulty: "صعوبة الذكاء الاصطناعي", scoreWins: "أعلى نتيجة تفوز!", upgrades: "ترقيات", money: "مال", paddleSpeed: "سرعة المضرب", paddleSize: "حجم المضرب", ballPower: "قوة الكرة", cost: "كلفة", level: "مستوى", gameDuration: "مدة اللعبة", durationNote: "سيتم التطبيق في المباراة القادمة", settings: "إعدادات", restart: "إعادة", playerFlag: "علم اللاعب", random: "عشوائي", totalWins: "مجموع الانتصارات", reset: "إعادة تعيين", tournament: "بطولة", aiFlag: "علم الذكاء الاصطناعي", round: "جولة", tournamentChampion: "بطل البطولة!", tournamentOver: "انتهت البطولة", matchWon: "فزت في المباراة!", nextMatch: "المباراة التالية", tournamentPrize: "لقد فزت بـ 500 دولار!", madeBy: "صنع بواسطة الكسندر خالينسكي", matchLost: "خسرت المباراة!", retryMatch: "إعادة المحاولة", livesLeft: "الأرواح المتبقية: {lives}" },
  es: { title: "Fútbol Pong", startGame: "Empezar Juego", paused: "Pausa", resume: "Reanudar", gameOver: "Juego Terminado", timesUp: "¡Se acabó el tiempo!", youWin: "¡Ganaste!", aiWins: "¡Gana la IA!", draw: "¡Es un empate!", player: "JUGADOR", ai: "IA", playAgain: "Jugar de Nuevo", language: "Idioma", difficulty: "Dificultad IA", scoreWins: "¡Gana el que más puntos tenga!", upgrades: "Mejoras", money: "Dinero", paddleSpeed: "Velocidad de Paleta", paddleSize: "Tamaño de Paleta", ballPower: "Poder de Pelota", cost: "Costo", level: "Nivel", gameDuration: "Duración del Juego", durationNote: "Se aplicará en el próximo juego", settings: "Ajustes", restart: "Reiniciar", playerFlag: "Bandera de Jugador", random: "Aleatorio", totalWins: "Victorias Totales", reset: "Reiniciar", tournament: "Torneo", aiFlag: "Bandera IA", round: "Ronda", tournamentChampion: "¡Campeón del Torneo!", tournamentOver: "Torneo Terminado", matchWon: "¡Partida Ganada!", nextMatch: "Siguiente Partida", tournamentPrize: "¡Ganaste $500!", madeBy: "Hecho por Alekhzandr Khalinski", matchLost: "¡Partida Perdida!", retryMatch: "Reintentar", livesLeft: "Vidas Restantes: {lives}" },
  pt: { title: "Futebol Pong", startGame: "Começar Jogo", paused: "Pausado", resume: "Continuar", gameOver: "Fim de Jogo", timesUp: "O tempo acabou!", youWin: "Você Venceu!", aiWins: "IA Venceu!", draw: "É um empate!", player: "JOGADOR", ai: "IA", playAgain: "Jogar Novamente", language: "Idioma", difficulty: "Dificuldade da IA", scoreWins: "Maior pontuação vence!", upgrades: "Melhorias", money: "Dinheiro", paddleSpeed: "Velocidade da Raquete", paddleSize: "Tamanho da Raquete", ballPower: "Força da Bola", cost: "Custo", level: "Nível", gameDuration: "Duração do Jogo", durationNote: "Será aplicado no próximo jogo", settings: "Configurações", restart: "Reiniciar", playerFlag: "Bandeira do Jogador", random: "Aleatório", totalWins: "Vitórias Totais", reset: "Resetar", tournament: "Torneio", aiFlag: "Bandeira da IA", round: "Rodada", tournamentChampion: "Campeão do Torneio!", tournamentOver: "Torneio Terminado", matchWon: "Partida Vencida!", nextMatch: "Próxima Partida", tournamentPrize: "Você ganhou $500!", madeBy: "Feito por Alekhzandr Khalinski", matchLost: "Partida Perdida!", retryMatch: "Tentar Novamente", livesLeft: "Vidas Restantes: {lives}" }
};

const languageEffects = { en: { rippleColor: 'rgba(0, 255, 255, 0.7)', goalFlash: 'rgba(255, 0, 255, 0.5)' }, de: { rippleColor: 'rgba(59, 130, 246, 0.7)', goalFlash: 'rgba(252, 211, 77, 0.5)' }, yi: { rippleColor: 'rgba(245, 158, 11, 0.7)', goalFlash: 'rgba(59, 130, 246, 0.5)' }, pl: { rippleColor: 'rgba(239, 68, 68, 0.7)', goalFlash: 'rgba(239, 68, 68, 0.5)' }, it: { rippleColor: 'rgba(34, 197, 94, 0.7)', goalFlash: 'rgba(34, 197, 94, 0.5)' }, ru: { rippleColor: 'rgba(217, 39, 46, 0.7)', goalFlash: 'rgba(217, 39, 46, 0.5)' }, ar: { rippleColor: 'rgba(206, 17, 38, 0.7)', goalFlash: 'rgba(206, 17, 38, 0.5)' }, es: { rippleColor: 'rgba(250, 204, 21, 0.7)', goalFlash: 'rgba(192, 38, 51, 0.5)' }, pt: { rippleColor: 'rgba(0, 156, 59, 0.7)', goalFlash: 'rgba(255, 223, 0, 0.5)' } };

const interactions = {
    en: { playerScore: ["Yes!", "Get in!", "Suck it!", "Motherfucker!"], aiScore: ["Shit!", "Fuck!", "No!"], playerHit: ["Take that!", "Asshole!", "Come on!"], aiHit: ["Got it.", "Nice."], aiMiss: ["Damn!", "Fuck!", "Close!"] },
    de: { playerScore: ["Ja!", "Fick dich!", "Arschloch!", "Hurensohn!"], aiScore: ["Verdammt!", "Nein!", "Scheiße!"], playerHit: ["Nimm das!", "Mistkerl!", "Fick ja!"], aiHit: ["Hab's.", "Gut."], aiMiss: ["Oje!", "Verdammt!", "Fast!"] },
    yi: { playerScore: ["יא!", "זונה!", "אין דער ערד!"], aiScore: ["ניין!", "א חזיר!", "גיי אין דר'ערד!"], playerHit: ["נעם דאָס!", "חזיר!", "פֿאַרשילטן!"], aiHit: ["געכאפט.", "גוט."], aiMiss: ["אוי וויי!", "פארשאלטן!", "כמעט!"] },
    pl: { playerScore: ["Kurwa!", "Ja pierdolę!", "Masz!", "Chuju!"], aiScore: ["Kurwa mać!", "Nie!", "Chuj!"], playerHit: ["Masz, kurwo!", "Pierdol się!", "Łap to!"], aiHit: ["Mam.", "Dobra."], aiMiss: ["O nie!", "Kurczę!", "Prawie!"] },
    it: { playerScore: ["Cazzo!", "Sì!", "Stronzo!", "Vaffanculo!"], aiScore: ["Merda!", "No!", "Porca!"], playerHit: ["Prendi!", "Stronzo!", "Beccati questo!"], aiHit: ["Preso.", "Bene."], aiMiss: ["Accidenti!", "Quasi!", "Mannaggia!"] },
    ru: { playerScore: ["Блять!", "Сука!", "Да!", "Уёбок!"], aiScore: ["Блять!", "Сука!", "Нет!"], playerHit: ["На, сука!", "Ебать!", "Получай!"], aiHit: ["Есть.", "Норм."], aiMiss: ["Черт!", "Бля!", "Почти!"] },
    ar: { playerScore: ["نعم!", "يا عرص!", "اللعنة!", "خذها!"], aiScore: ["اللعنة!", "لا!", "تبا!"], playerHit: ["خذ!", "يا ابن الشرموطة!", "اللعنة!"], aiHit: ["عندي.", "جيد."], aiMiss: ["يا إلهي!", "اللعنة!", "قريب!"] },
    es: { playerScore: ["¡Sí!", "¡Joder!", "¡Cabrón!", "¡Toma!"], aiScore: ["¡Mierda!", "¡No!", "¡Joder!"], playerHit: ["¡Toma eso!", "¡Puto!", "¡Venga!"], aiHit: ["Lo tengo.", "Bien."], aiMiss: ["¡Maldita sea!", "¡Casi!", "¡Joder!"] },
    pt: { playerScore: ["Boa!", "Caralho!", "Toma!", "Filho da puta!"], aiScore: ["Merda!", "Não!", "Porra!"], playerHit: ["Pega!", "Cabrão!", "Vai!"], aiHit: ["Peguei.", "Boa."], aiMiss: ["Droga!", "Quase!", "Porra!"] },
};

// AI has slightly different, more arrogant/robotic personality
const ai_interactions_en = { scoreForAI: ["Too easy.", "Goal.", "Predictable."], scoreAgainstAI: ["Luck.", "Whatever.", "Mistake.", "Fuck off."], hit: ["Denied.", "Simple."], miss: ["Close.", "Calculation error."] };
const ai_interactions_fr = { scoreForAI: ["Facile.", "But.", "Prévisible."], scoreAgainstAI: ["Chanceux.", "N'importe quoi.", "Erreur.", "Va te faire foutre."], hit: ["Bloqué.", "Simple."], miss: ["Presque.", "Erreur de calcul."] };
const ai_interactions_de = { scoreForAI: ["Zu einfach.", "Tor.", "Vorhersehbar."], scoreAgainstAI: ["Glück.", "Egal.", "Fehler.", "Fick dich."], hit: ["Gehalten.", "Einfach."], miss: ["Knapp.", "Rechenfehler."] };
const ai_interactions_ru = { scoreForAI: ["Слишком легко.", "Гол.", "Предсказуемо."], scoreAgainstAI: ["Везёт.", "Похуй.", "Ошибка.", "Иди на хуй."], hit: ["Отбил.", "Просто."], miss: ["Почти.", "Ошибка в расчетах."] };
const ai_interactions_ar = { scoreForAI: ["سهل جدا.", "هدف.", "متوقع."], scoreAgainstAI: ["حظ.", "لا يهم.", "خطأ.", "اغرب عن وجهي."], hit: ["مصدود.", "بسيط."], miss: ["قريب.", "خطأ حسابي."] };
const ai_interactions_yi = { scoreForAI: ["צו גרינג.", "ציל.", "פּרידיקטאַבאַל."], scoreAgainstAI: ["מזל.", "וועלכער.", "טעות.", "גיי קאַקן."], hit: ["געלייקנט.", "פּשוט."], miss: ["נאָענט.", "חשבון טעות."] };
const ai_interactions_pl = { scoreForAI: ["Zbyt łatwe.", "Gol.", "Przewidywalne."], scoreAgainstAI: ["Szczęście.", "Nieważne.", "Błąd.", "Spierdalaj."], hit: ["Zablokowane.", "Proste."], miss: ["Blisko.", "Błąd obliczeniowy."] };
const ai_interactions_it = { scoreForAI: ["Troppo facile.", "Gol.", "Prevedibile."], scoreAgainstAI: ["Fortuna.", "Vabbè.", "Errore.", "Vaffanculo."], hit: ["Negato.", "Semplice."], miss: ["Quasi.", "Errore di calcolo."] };
const ai_interactions_es = { scoreForAI: ["Demasiado fácil.", "Gol.", "Predecible."], scoreAgainstAI: ["Suerte.", "Como sea.", "Error.", "Vete a la mierda."], hit: ["Bloqueado.", "Simple."], miss: ["Casi.", "Error de cálculo."] };
const ai_interactions_pt = { scoreForAI: ["Fácil demais.", "Golo.", "Previsível."], scoreAgainstAI: ["Sorte.", "Tanto faz.", "Erro.", "Vai se foder."], hit: ["Negado.", "Simples."], miss: ["Quase.", "Erro de cálculo."] };

const availableFlags = ['de', 'it', 'fr', 'pl', 'by', 'il', 'ps', 'ru', 'es', 'br'];

// --- UI COMPONENTS ---
const StarOfDavid = ({ color, size, className }: { color: string; size: number; className?: string }) => { const triHeight = size * 0.866; const containerStyle: React.CSSProperties = { position: 'relative', width: size, height: size }; const triangleShared: React.CSSProperties = { position: 'absolute', width: 0, height: 0, borderLeft: `${size / 2}px solid transparent`, borderRight: `${size / 2}px solid transparent` }; return ( <div style={containerStyle} className={className}> <div style={{ ...triangleShared, borderBottom: `${triHeight}px solid ${color}`, top: `${(size - triHeight) / 2}px` }} /> <div style={{ ...triangleShared, borderTop: `${triHeight}px solid ${color}`, bottom: `${(size - triHeight) / 2}px` }} /> </div> ); };
const Flag = ({ country, className }: { country: string; className?: string }) => { const baseClasses = `overflow-hidden border border-white/20 shadow-md ${className}`; switch (country) { case 'de': return <div className={`flex flex-col ${baseClasses}`}><div className="h-1/3 w-full bg-black"></div><div className="h-1/3 w-full bg-red-600"></div><div className="h-1/3 w-full bg-yellow-400"></div></div>; case 'it': return <div className={`flex ${baseClasses}`}><div className="w-1/3 h-full bg-green-600"></div><div className="w-1/3 h-full bg-white"></div><div className="w-1/3 h-full bg-red-600"></div></div>; case 'fr': return <div className={`flex ${baseClasses}`}><div className="w-1/3 h-full bg-blue-800"></div><div className="w-1/3 h-full bg-white"></div><div className="w-1/3 h-full bg-red-600"></div></div>; case 'pl': return <div className={`flex flex-col ${baseClasses}`}><div className="h-1/2 w-full bg-white"></div><div className="h-1/2 w-full bg-red-600"></div></div>; case 'by': return <div className={`flex flex-col ${baseClasses}`}><div className="h-2/3 w-full bg-red-600"></div><div className="h-1/3 w-full bg-green-600"></div></div>; case 'il': return <div className={`relative bg-white flex flex-col justify-between ${baseClasses}`}><div className="h-[16%] w-full bg-blue-600"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><StarOfDavid color="#0038b8" size={24} /></div><div className="h-[16%] w-full bg-blue-600"></div></div>; case 'ps': return <div className={`relative flex flex-col ${baseClasses}`}><div className="h-1/3 w-full bg-black"></div><div className="h-1/3 w-full bg-white"></div><div className="h-1/3 w-full bg-green-700"></div><div className="absolute top-0 left-0 h-full w-1/2 bg-red-600" style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}></div></div>; case 'ru': return <div className={`flex flex-col ${baseClasses}`}><div className="h-1/3 w-full bg-white"></div><div className="h-1/3 w-full bg-blue-600"></div><div className="h-1/3 w-full bg-red-600"></div></div>; case 'es': return <div className={`flex flex-col ${baseClasses}`}><div className="h-1/4 w-full bg-red-600"></div><div className="h-1/2 w-full bg-yellow-400"></div><div className="h-1/4 w-full bg-red-600"></div></div>; case 'br': return <div className={`relative flex justify-center items-center bg-green-600 ${baseClasses}`}><div className="w-4/5 h-3/5 bg-yellow-400" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}></div><div className="absolute w-[40%] h-[40%] bg-blue-800 rounded-full"></div></div>; default: return null; } };

// --- MAIN APP ---
const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [tournamentState, setTournamentState] = useState<{ round: number; flags: string[]; lives: number; } | null>(null);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [language, setLanguage] = useState<Language>('en');
  const [difficulty, setDifficulty] = useState<number>(5);
  const [currentAiDifficulty, setCurrentAiDifficulty] = useState<number>(5);
  const [keysPressed, setKeysPressed] = useState<{ [key: string]: boolean }>({});
  const [aiMessage, setAiMessage] = useState<Message | null>(null);
  const [playerMessage, setPlayerMessage] = useState<Message | null>(null);
  const [playerPaddleY, setPlayerPaddleY] = useState(GAME_HEIGHT / 2 - BASE_PADDLE_HEIGHT / 2);
  const [aiPaddleY, setAiPaddleY] = useState(GAME_HEIGHT / 2 - AI_PADDLE_HEIGHT / 2);
  const [ball, setBall] = useState({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2, vx: 0, vy: 0 });
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [shockwaves, setShockwaves] = useState<Shockwave[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [money, setMoney] = useState<number>(() => parseInt(localStorage.getItem('pongMoney') || '0'));
  const [wins, setWins] = useState<number>(() => parseInt(localStorage.getItem('pongWins') || '0'));
  const [playerFlag, setPlayerFlag] = useState<string>('de');
  const [isRandomPlayerFlag, setIsRandomPlayerFlag] = useState<boolean>(false);
  const [aiFlag, setAiFlag] = useState<string>('fr');
  const [isRandomAiFlag, setIsRandomAiFlag] = useState<boolean>(true);
  const [currentAiFlag, setCurrentAiFlag] = useState<string>('fr');
  const [speedLevel, setSpeedLevel] = useState<number>(() => parseInt(localStorage.getItem('pongSpeedLevel') || '1'));
  const [paddleHeightLevel, setPaddleHeightLevel] = useState<number>(() => parseInt(localStorage.getItem('pongPaddleHeightLevel') || '1'));
  const [ballPowerLevel, setBallPowerLevel] = useState<number>(() => parseInt(localStorage.getItem('pongBallPowerLevel') || '1'));
  const [gameDuration, setGameDuration] = useState(GAME_DURATION);
  const [timer, setTimer] = useState(gameDuration);
  const [shake, setShake] = useState(0);
  const [ballFlash, setBallFlash] = useState(false);
  const [goalFlash, setGoalFlash] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextId = useRef(0);
  const animationFrameId = useRef<number | null>(null);
  const bonusAwarded = useRef(true);
  
  // Audio Refs
  const clickAudioRef = useRef<HTMLAudioElement>(null);
  const explosionAudioRef = useRef<HTMLAudioElement>(null);
  const erikaAudioRef = useRef<HTMLAudioElement>(null);
  const belarusAudioRef = useRef<HTMLAudioElement>(null);
  const sovietAudioRef = useRef<HTMLAudioElement>(null);
  const franceAudioRef = useRef<HTMLAudioElement>(null);
  const palestineAudioRef = useRef<HTMLAudioElement>(null);
  const allMusicRefs = [erikaAudioRef, belarusAudioRef, sovietAudioRef, franceAudioRef, palestineAudioRef];


  useEffect(() => { localStorage.setItem('pongMoney', money.toString()); }, [money]);
  useEffect(() => { localStorage.setItem('pongWins', wins.toString()); }, [wins]);
  useEffect(() => { localStorage.setItem('pongSpeedLevel', speedLevel.toString()); }, [speedLevel]);
  useEffect(() => { localStorage.setItem('pongPaddleHeightLevel', paddleHeightLevel.toString()); }, [paddleHeightLevel]);
  useEffect(() => { localStorage.setItem('pongBallPowerLevel', ballPowerLevel.toString()); }, [ballPowerLevel]);

  useEffect(() => { const loadVoices = () => setVoices(speechSynthesis.getVoices()); speechSynthesis.addEventListener('voiceschanged', loadVoices); loadVoices(); return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices); }, []);

  const speak = useCallback((text: string, lang: AILanguage, isAI: boolean) => { if (voices.length === 0 || speechSynthesis.speaking) return; const utterance = new SpeechSynthesisUtterance(text); utterance.rate = 1.7; const langCodeMap: { [key in AILanguage]: string } = { en: 'en', de: 'de', yi: 'he', pl: 'pl', it: 'it', ar: 'ar', fr: 'fr', ru: 'ru', es: 'es', pt: 'pt' }; const targetLang = langCodeMap[lang]; const availableVoices = voices.filter(v => v.lang.startsWith(targetLang)); if (availableVoices.length > 0) { utterance.voice = availableVoices.length > 1 && isAI ? availableVoices[1] : availableVoices[0]; } speechSynthesis.speak(utterance); }, [voices]);
  const playSound = (type: 'hit' | 'score' | 'wall') => { if (!audioContextRef.current) return; const context = audioContextRef.current; const oscillator = context.createOscillator(); const gainNode = context.createGain(); if (type === 'hit') { oscillator.type = 'triangle'; oscillator.frequency.setValueAtTime(200, context.currentTime); gainNode.gain.setValueAtTime(0.3, context.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2); } else if (type === 'wall') { oscillator.type = 'square'; oscillator.frequency.setValueAtTime(150, context.currentTime); gainNode.gain.setValueAtTime(0.2, context.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15); } else if (type === 'score') { oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(300, context.currentTime); oscillator.frequency.exponentialRampToValueAtTime(600, context.currentTime + 0.3); gainNode.gain.setValueAtTime(0.4, context.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5); } oscillator.connect(gainNode); gainNode.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.5); };
  const playSoundEffect = (audioRef: React.RefObject<HTMLAudioElement>) => { if(audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.volume = 0.5; audioRef.current.play(); }};
  const initAudio = () => { if (!audioContextRef.current) { try { audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch (e) { console.error("Web Audio API is not supported in this browser"); } } };
  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const resetBall = useCallback((direction: 'left' | 'right') => { setBall({ x: GAME_WIDTH / 2 - BALL_SIZE / 2, y: Math.random() * (GAME_HEIGHT - 100) + 50, vx: direction === 'left' ? -INITIAL_BALL_SPEED_X : INITIAL_BALL_SPEED_X, vy: (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 2 + INITIAL_BALL_SPEED_Y) }); setTrail([]); }, []);
  
  const resetMatch = useCallback(() => {
    setScore({ player: 0, ai: 0 });
    const playerPaddleHeight = BASE_PADDLE_HEIGHT + (paddleHeightLevel - 1) * 5;
    setPlayerPaddleY(GAME_HEIGHT / 2 - playerPaddleHeight / 2);
    setAiPaddleY(GAME_HEIGHT / 2 - AI_PADDLE_HEIGHT / 2);
    resetBall(Math.random() > 0.5 ? 'left' : 'right');
    setTimer(gameDuration);
    setGameState('playing');
    setRipples([]);
    setShockwaves([]);
    setParticles([]);
    setAiMessage(null);
    setPlayerMessage(null);
    bonusAwarded.current = false;
  }, [resetBall, gameDuration, paddleHeightLevel]);

  const startGame = useCallback((mode: GameMode) => {
    initAudio();
    speechSynthesis.cancel();
    setGameMode(mode);

    if (isRandomPlayerFlag) {
        setPlayerFlag(availableFlags[Math.floor(Math.random() * availableFlags.length)]);
    }

    if (mode === 'classic') {
        setTournamentState(null);
        setCurrentAiDifficulty(difficulty);
        if(isRandomAiFlag) {
            setCurrentAiFlag(availableFlags[Math.floor(Math.random() * availableFlags.length)]);
        } else {
            setCurrentAiFlag(aiFlag);
        }
    } else if (mode === 'tournament') {
        const shuffledFlags = [...availableFlags].sort(() => 0.5 - Math.random());
        const tourneyFlags = shuffledFlags.slice(0, 3);
        const newTournamentState = { round: 1, flags: tourneyFlags, lives: 2 };
        setTournamentState(newTournamentState);
        setCurrentAiDifficulty(4); // Round 1 difficulty
        setCurrentAiFlag(tourneyFlags[0]);
    }
    resetMatch();
  }, [resetMatch, isRandomPlayerFlag, isRandomAiFlag, aiFlag, difficulty]);

  const startNextTournamentMatch = useCallback(() => {
    if (!tournamentState) return;
    const nextRound = tournamentState.round + 1;
    const nextTournamentState = { ...tournamentState, round: nextRound };
    setTournamentState(nextTournamentState);
    
    const difficulties = [4, 6, 8];
    setCurrentAiDifficulty(difficulties[nextRound - 1]);
    setCurrentAiFlag(nextTournamentState.flags[nextRound - 1]);
    
    resetMatch();
}, [tournamentState, resetMatch]);

const retryTournamentMatch = useCallback(() => {
    if (!tournamentState) return;
    // Don't change round, flag, or lives. Just reset the match.
    resetMatch();
}, [tournamentState, resetMatch]);

const createGoalExplosion = (x: number, y: number) => {
    playSoundEffect(explosionAudioRef);
    const newParticles = Array.from({ length: 50 }).map(() => ({
      id: nextId.current++,
      x,
      y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 60,
      size: Math.random() * 4 + 2,
    }));
    setParticles(prev => [...prev, ...newParticles]);
  };

  const triggerInteraction = useCallback((type: InteractionType, x?: number, y?: number) => { 
    const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]; 
    const langInteractions = interactions[language]; 
    
    const flagToLangMap: { [key: string]: AILanguage } = { de: 'de', it: 'it', fr: 'fr', pl: 'pl', by: 'ru', il: 'yi', ps: 'ar', ru: 'ru', es: 'es', br: 'pt' };
    const allAiInteractions = { en: ai_interactions_en, de: ai_interactions_de, fr: ai_interactions_fr, ru: ai_interactions_ru, ar: ai_interactions_ar, yi: ai_interactions_yi, pl: ai_interactions_pl, it: ai_interactions_it, es: ai_interactions_es, pt: ai_interactions_pt, };
    const aiLang = flagToLangMap[currentAiFlag] || 'fr';
    const aiInteractions = allAiInteractions[aiLang as keyof typeof allAiInteractions] || ai_interactions_fr;

    const createMessage = (setText: React.Dispatch<React.SetStateAction<Message | null>>, text: string) => { const newId = nextId.current++; setText({ id: newId, text }); setTimeout(() => setText(prev => prev && prev.id === newId ? null : prev), 3000); }; const createShockwave = (x: number, y: number) => setShockwaves(prev => [...prev, { id: nextId.current++, x, y, radius: 10, opacity: 1, thickness: 3 }]); if (type === 'playerScore') { const pMsg1 = pickRandom(langInteractions.playerScore); let pMsg2 = pickRandom(langInteractions.playerScore); while (pMsg1 === pMsg2) pMsg2 = pickRandom(langInteractions.playerScore); createMessage(setPlayerMessage, `${pMsg1} ${pMsg2}`); speak(pMsg1, language, false); setTimeout(() => speak(pMsg2, language, false), 250); const aMsg1 = pickRandom(aiInteractions.scoreAgainstAI); let aMsg2 = pickRandom(aiInteractions.scoreAgainstAI); while (aMsg1 === aMsg2) aMsg2 = pickRandom(aiInteractions.scoreAgainstAI); createMessage(setAiMessage, `${aMsg1} ${aMsg2}`); setTimeout(() => speak(aMsg1, aiLang, true), 500); setTimeout(() => speak(aMsg2, aiLang, true), 750); setShake(15); setGoalFlash(languageEffects[language].goalFlash); setTimeout(() => setGoalFlash(''), 250); } else if (type === 'aiScore') { const pMsg = pickRandom(langInteractions.aiScore); createMessage(setPlayerMessage, pMsg); speak(pMsg, language, false); const aMsg = pickRandom(aiInteractions.scoreForAI); createMessage(setAiMessage, aMsg); setTimeout(() => speak(aMsg, aiLang, true), 250); setShake(15); setGoalFlash('rgba(248, 113, 113, 0.5)'); setTimeout(() => setGoalFlash(''), 250); } else if (type === 'playerHit' && x && y) { const pMsg1 = pickRandom(langInteractions.playerHit); let pMsg2 = pickRandom(langInteractions.playerHit); while (pMsg1 === pMsg2) pMsg2 = pickRandom(langInteractions.playerHit); createMessage(setPlayerMessage, `${pMsg1} ${pMsg2}`); speak(pMsg1, language, false); setTimeout(() => speak(pMsg2, language, false), 250); setBallFlash(true); setTimeout(() => setBallFlash(false), 100); createShockwave(x, y); } else if (type === 'aiHit' && x && y) { const aMsg = pickRandom(aiInteractions.hit); createMessage(setAiMessage, aMsg); speak(aMsg, aiLang, true); setBallFlash(true); setTimeout(() => setBallFlash(false), 100); createShockwave(x, y); } else if (type === 'aiMiss') { const aMsg1 = pickRandom(aiInteractions.miss); let aMsg2 = pickRandom(aiInteractions.miss); while (aMsg1 === aMsg2) aMsg2 = pickRandom(aiInteractions.miss); createMessage(setAiMessage, `${aMsg1} ${aMsg2}`); speak(aMsg1, aiLang, true); setTimeout(() => speak(aMsg2, aiLang, true), 250); } }, [language, speak, currentAiFlag]);
  
  useEffect(() => { const handleKey = (e: KeyboardEvent, isDown: boolean) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') setKeysPressed(prev => ({...prev, [e.key]: isDown })); if (isDown && e.key === 'Escape' && (gameState === 'playing' || gameState === 'paused')) setGameState(prev => prev === 'playing' ? 'paused' : 'playing'); }; const down = (e:KeyboardEvent)=>handleKey(e,true); const up = (e:KeyboardEvent)=>handleKey(e,false); window.addEventListener('keydown', down); window.addEventListener('keyup', up); return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); }; }, [gameState]);
  useEffect(() => { if (gameState === 'playing' && timer > 0) { const id = setInterval(() => setTimer(t => t - 1), 1000); return () => clearInterval(id); } else if (timer <= 0 && gameState === 'playing') setGameState('gameOver'); }, [gameState, timer]);
  
  useEffect(() => {
    if (gameState === 'gameOver' && !bonusAwarded.current) {
        if (gameMode === 'classic') {
            if (score.player > score.ai) {
                setWins(w => w + 1);
                setMoney(m => m + 100);
            } else if (score.player === score.ai) {
                setMoney(m => m + 50);
            } else {
                setMoney(m => m + 25);
            }
        } else if (gameMode === 'tournament' && tournamentState) {
            if (score.player > score.ai) {
                if (tournamentState.round < 3) {
                    setGameState('tournamentTransition');
                } else {
                    setMoney(m => m + 500);
                    setWins(w => w + 1);
                }
            } else {
                setTournamentState(prev => ({ ...prev!, lives: prev!.lives - 1 }));
            }
        }
        bonusAwarded.current = true;
    }
}, [gameState, score, gameMode, tournamentState]);

  useEffect(() => { 
      speechSynthesis.cancel(); 
      allMusicRefs.forEach(ref => {
          if (ref.current) {
              ref.current.pause();
              ref.current.currentTime = 0;
          }
      });
      if(gameState === 'playing') {
        let musicRef: React.RefObject<HTMLAudioElement> | null = null;
        switch (playerFlag) {
            case 'de': musicRef = erikaAudioRef; break;
            case 'by': musicRef = belarusAudioRef; break;
            case 'ru': musicRef = sovietAudioRef; break;
            case 'fr': musicRef = franceAudioRef; break;
            case 'ps': musicRef = palestineAudioRef; break;
        }
        if(musicRef?.current) {
            musicRef.current.volume = 0.3;
            musicRef.current.loop = true;
            musicRef.current.play();
        }
      }
    }, [gameState, playerFlag]);

  const playerPaddleSpeed = BASE_PLAYER_PADDLE_SPEED + (speedLevel - 1) * 0.75;
  const playerPaddleHeight = BASE_PADDLE_HEIGHT + (paddleHeightLevel - 1) * 5;
  const ballPowerMultiplier = 1.04 + (ballPowerLevel - 1) * 0.015;

  useEffect(() => {
    if (gameState !== 'playing') { if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current); return; }
    const gameLoop = () => {
      if (shake > 0) setShake(s => s * 0.9);
      setPlayerPaddleY(prevY => { let newY = prevY; if (keysPressed['ArrowUp']) newY -= playerPaddleSpeed; if (keysPressed['ArrowDown']) newY += playerPaddleSpeed; return Math.max(0, Math.min(newY, GAME_HEIGHT - playerPaddleHeight)); });
      setRipples(prev => prev.map(r => ({ ...r, radius: r.radius + (r.isGoal ? 2 : 1.5), opacity: r.opacity - (r.isGoal ? 0.02 : 0.015) })).filter(r => r.opacity > 0));
      setShockwaves(prev => prev.map(s => ({ ...s, radius: s.radius + 4, opacity: s.opacity - 0.03, thickness: s.thickness * 0.96 })).filter(s => s.opacity > 0));
      setParticles(prev => prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.1, life: p.life - 1 })).filter(p => p.life > 0));

      const createParticles = (x: number, y: number) => { const newParticles = Array.from({ length: 10 }).map((_, i) => ({ id: nextId.current++ + i, x, y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 30, size: Math.random() * 3 + 1, })); setParticles(prev => [...prev, ...newParticles]); };
      setBall(prevBall => {
        let { x, y, vx, vy } = { ...prevBall }; x += vx; y += vy;
        const createRipple = (x: number, y: number, isGoal = false) => setRipples(prev => [...prev, { id: nextId.current++, x, y, radius: 0, opacity: isGoal ? 0.8 : 0.6, isGoal}]);
        const GOAL_Y_START = (GAME_HEIGHT - GOAL_HEIGHT) / 2;
        if (x <= 0) { if (y > GOAL_Y_START && y < GOAL_Y_START + GOAL_HEIGHT) { setScore(s => ({ ...s, ai: s.ai + 1 })); createRipple(20, GAME_HEIGHT / 2, true); createGoalExplosion(20, GAME_HEIGHT / 2); playSound('score'); triggerInteraction('aiScore'); resetBall('right'); return prevBall; } else { x = 0; vx = -vx; playSound('wall'); createRipple(x, y + BALL_SIZE / 2); createParticles(x, y + BALL_SIZE/2); } }
        else if (x >= GAME_WIDTH - BALL_SIZE) { if (y > GOAL_Y_START && y < GOAL_Y_START + GOAL_HEIGHT) { setScore(s => ({ ...s, player: s.player + 1 })); if(gameMode === 'classic') setMoney(m => m + 25); createRipple(GAME_WIDTH - 20, GAME_HEIGHT / 2, true); createGoalExplosion(GAME_WIDTH - 20, GAME_HEIGHT / 2); playSound('score'); triggerInteraction('playerScore'); resetBall('left'); return prevBall; } else { x = GAME_WIDTH - BALL_SIZE; vx = -vx; playSound('wall'); createRipple(x + BALL_SIZE, y + BALL_SIZE / 2); triggerInteraction('aiMiss'); createParticles(x + BALL_SIZE, y + BALL_SIZE/2); } }
        if (y <= 0) { y = 0; vy = -vy; playSound('wall'); createRipple(x + BALL_SIZE / 2, y); createParticles(x + BALL_SIZE / 2, y); } else if (y >= GAME_HEIGHT - BALL_SIZE) { y = GAME_HEIGHT - BALL_SIZE; vy = -vy; playSound('wall'); createRipple(x + BALL_SIZE / 2, y + BALL_SIZE); createParticles(x + BALL_SIZE / 2, y + BALL_SIZE); }
        const player = { x: PADDLE_MARGIN, y: playerPaddleY, w: PADDLE_WIDTH, h: playerPaddleHeight }; const ai = { x: GAME_WIDTH - PADDLE_WIDTH - PADDLE_MARGIN, y: aiPaddleY, w: PADDLE_WIDTH, h: AI_PADDLE_HEIGHT };
        if (vx < 0 && x < player.x + player.w && x + BALL_SIZE > player.x && y + BALL_SIZE > player.y && y < player.y + player.h) { const hitY = y + BALL_SIZE / 2; vx = -vx * ballPowerMultiplier; const hitPos = (hitY - player.y) / player.h; vy += (hitPos - 0.5) * 6; x = player.x + player.w; playSound('hit'); triggerInteraction('playerHit', x, hitY); createRipple(x, hitY); }
        else if (vx > 0 && x + BALL_SIZE > ai.x && x < ai.x + ai.w && y + BALL_SIZE > ai.y && y < ai.y + ai.h) { const hitY = y + BALL_SIZE / 2; vx = -vx * 1.04; const hitPos = (hitY - ai.y) / ai.h; vy += (hitPos - 0.5) * 6; x = ai.x - BALL_SIZE; playSound('hit'); triggerInteraction('aiHit', x, hitY); createRipple(x, hitY); }
        if (Math.abs(vy) < 0.5) vy = Math.sign(vy) * 0.5;
        setTrail(prev => [...prev, { x: x + BALL_SIZE / 2, y: y + BALL_SIZE / 2 }].slice(-TRAIL_LENGTH)); return { x, y, vx, vy };
      });
      setAiPaddleY(prevAiY => { if (ball.vx > 0) { const speed = MIN_AI_SPEED + (currentAiDifficulty - 1) * ((MAX_AI_SPEED - MIN_AI_SPEED) / 9); const targetY = ball.y + BALL_SIZE / 2 - AI_PADDLE_HEIGHT / 2; const delta = targetY - prevAiY; const move = Math.sign(delta) * Math.min(Math.abs(delta), speed); return Math.max(0, Math.min(GAME_HEIGHT - AI_PADDLE_HEIGHT, prevAiY + move)); } return prevAiY; });
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };
    animationFrameId.current = requestAnimationFrame(gameLoop); return () => { if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current); };
  }, [gameState, keysPressed, resetBall, ball.vx, currentAiDifficulty, triggerInteraction, playerPaddleSpeed, playerPaddleHeight, ballPowerMultiplier, shake, gameMode]);

  const getOverlay = () => {
    const T = translations[language];
    const speedUpgradeCost = 50 * speedLevel;
    const heightUpgradeCost = 75 * paddleHeightLevel;
    const powerUpgradeCost = 100 * ballPowerLevel;
    const handleUpgrade = (cost: number, currentLevel: number, setLevel: React.Dispatch<React.SetStateAction<number>>) => { playSoundEffect(clickAudioRef); if (money >= cost) { setMoney(m => m - cost); setLevel(l => l + 1); } };
    const base = "absolute inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center text-white z-30 text-center p-4 backdrop-blur-sm";
    const btn = "mt-4 px-6 py-3 bg-cyan-500 text-black font-bold text-xl rounded-lg hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/50";
    if (gameState === 'menu') return <div className={base}><h1 className="text-6xl font-extrabold tracking-wider" style={{ textShadow: '0 0 8px #0ff, 0 0 12px #0ff, 0 0 20px #0ff' }}>{T.title}</h1><p className="mt-2 text-sm text-gray-400">{T.madeBy}</p><p className="mt-4 text-xl text-gray-300">{T.scoreWins}</p><div className="flex gap-4"><button onClick={() => {playSoundEffect(clickAudioRef); startGame('classic')}} className={btn}>{T.startGame}</button><button onClick={() => {playSoundEffect(clickAudioRef); startGame('tournament')}} className={`${btn} bg-fuchsia-500 hover:bg-fuchsia-400 shadow-fuchsia-500/50`}>{T.tournament}</button></div></div>;
    if (gameState === 'paused') return <div className={base}><h1 className="text-6xl font-extrabold tracking-wider">{T.paused}</h1><div className="flex flex-wrap justify-center gap-6 mt-6 w-full max-w-5xl"><div className="flex-1 min-w-[240px] bg-black/40 p-4 rounded-lg border border-cyan-500/50"><h3 className="text-xl font-bold mb-2 text-cyan-300">{T.upgrades}</h3><p className="text-lg font-bold mb-3">{T.money}: ${money}</p><div className="space-y-2 text-left"><div className="p-2 bg-black/40 rounded"><p>{T.paddleSpeed} ({T.level} {speedLevel})</p><button onClick={() => handleUpgrade(speedUpgradeCost, speedLevel, setSpeedLevel)} disabled={money < speedUpgradeCost} className="w-full mt-1 px-3 py-1 text-sm bg-fuchsia-600 rounded disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-fuchsia-700 transition-colors">{`Upgrade ($${speedUpgradeCost})`}</button></div><div className="p-2 bg-black/40 rounded"><p>{T.paddleSize} ({T.level} {paddleHeightLevel})</p><button onClick={() => handleUpgrade(heightUpgradeCost, paddleHeightLevel, setPaddleHeightLevel)} disabled={money < heightUpgradeCost} className="w-full mt-1 px-3 py-1 text-sm bg-fuchsia-600 rounded disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-fuchsia-700 transition-colors">{`Upgrade ($${heightUpgradeCost})`}</button></div><div className="p-2 bg-black/40 rounded"><p>{T.ballPower} ({T.level} {ballPowerLevel})</p><button onClick={() => handleUpgrade(powerUpgradeCost, ballPowerLevel, setBallPowerLevel)} disabled={money < powerUpgradeCost} className="w-full mt-1 px-3 py-1 text-sm bg-fuchsia-600 rounded disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-fuchsia-700 transition-colors">{`Upgrade ($${powerUpgradeCost})`}</button></div></div></div><div className="flex-1 min-w-[320px] bg-black/40 p-4 rounded-lg border border-cyan-500/50"><h3 className="text-xl font-bold mb-2 text-cyan-300">{T.settings}</h3><div className="grid grid-cols-2 gap-x-4"><div className="text-left"><h4 className="text-lg font-semibold mb-1">{T.language}</h4><div className="flex gap-1 flex-wrap justify-start">{Object.keys(translations).map(l => <button key={l} onClick={()=>{playSoundEffect(clickAudioRef); setLanguage(l as Language)}} className={`px-2 py-1 rounded text-xs ${language===l?'bg-cyan-600':'bg-gray-700 hover:bg-gray-600'}`}>{l.toUpperCase()}</button>)}</div></div><div className="text-left"><h4 className="text-lg font-semibold mb-1">{T.difficulty} ({T.round}: {difficulty})</h4><div className="flex gap-1 flex-wrap justify-start">{Array.from({length:10},(_,i)=>i+1).map(lvl=><button key={lvl} onClick={()=>{playSoundEffect(clickAudioRef); setDifficulty(lvl)}} className={`w-7 h-7 flex items-center justify-center rounded text-xs ${difficulty===lvl?'bg-cyan-600':'bg-gray-700 hover:bg-gray-600'}`}>{lvl}</button>)}</div></div><div className="text-left mt-2"><h4 className="text-lg font-semibold mb-1">{T.playerFlag}</h4><div className="flex gap-1 flex-wrap justify-start items-center"><button onClick={() => {playSoundEffect(clickAudioRef); setIsRandomPlayerFlag(true)}} className={`px-2 py-1 rounded text-xs ${isRandomPlayerFlag ? 'bg-cyan-600' : 'bg-gray-700 hover:bg-gray-600'}`}>{T.random}</button>{availableFlags.map(flag => (<button key={flag} onClick={() => { playSoundEffect(clickAudioRef); setPlayerFlag(flag); setIsRandomPlayerFlag(false); }} className={`w-8 h-6 relative rounded overflow-hidden border-2 ${!isRandomPlayerFlag && playerFlag === flag ? 'border-cyan-400' : 'border-transparent opacity-70 hover:opacity-100'}`}><Flag country={flag} className="w-full h-full" /></button>))}</div></div><div className="text-left mt-2"><h4 className="text-lg font-semibold mb-1">{T.aiFlag}</h4><div className="flex gap-1 flex-wrap justify-start items-center"><button onClick={() => {playSoundEffect(clickAudioRef); setIsRandomAiFlag(true)}} className={`px-2 py-1 rounded text-xs ${isRandomAiFlag ? 'bg-cyan-600' : 'bg-gray-700 hover:bg-gray-600'}`}>{T.random}</button>{availableFlags.map(flag => (<button key={flag} onClick={() => { playSoundEffect(clickAudioRef); setAiFlag(flag); setIsRandomAiFlag(false); }} className={`w-8 h-6 relative rounded overflow-hidden border-2 ${!isRandomAiFlag && aiFlag === flag ? 'border-cyan-400' : 'border-transparent opacity-70 hover:opacity-100'}`}><Flag country={flag} className="w-full h-full" /></button>))}</div></div></div><div className="flex justify-center items-center gap-4 mt-3 text-cyan-200"><p>{T.totalWins}: {wins}</p><button onClick={() => {playSoundEffect(clickAudioRef); setWins(0)}} className="px-3 py-1 text-sm bg-red-600 rounded hover:bg-red-700 transition-colors">{T.reset}</button></div></div></div><div className="flex gap-4"><button onClick={()=>{playSoundEffect(clickAudioRef); setGameState('playing')}} className={btn}>{T.resume}</button><button onClick={() => {playSoundEffect(clickAudioRef); startGame(gameMode)}} className={`${btn} bg-red-600 hover:bg-red-700 shadow-red-500/50`}>{T.restart}</button></div></div>;
    if (gameState === 'gameOver') {
        let msg = score.player > score.ai ? T.youWin : score.ai > score.player ? T.aiWins : T.draw;
        let isTournamentEnd = false;
        let canRetry = false;
        
        if (gameMode === 'tournament' && tournamentState) {
            if (score.player > score.ai) {
                if (tournamentState.round === 3) msg = T.tournamentChampion;
            } else { // Player lost
                if (tournamentState.lives > 0) {
                    msg = T.matchLost;
                    canRetry = true;
                } else {
                    msg = T.tournamentOver;
                    isTournamentEnd = true;
                }
            }
        }

        return <div className={base}>
            <h1 className="text-6xl font-extrabold tracking-wider">{gameMode === 'classic' && timer <= 0 ? T.timesUp : msg}</h1>
            {gameMode === 'classic' && timer > 0 && <p className="mt-4 text-3xl">{msg}</p>}
            {msg === T.tournamentChampion && <p className="mt-4 text-2xl text-yellow-300">{T.tournamentPrize}</p>}
            <p className="mt-2 text-2xl font-mono">{score.player} - {score.ai}</p>
            {canRetry && <p className="mt-2 text-xl text-yellow-300">{T.livesLeft.replace('{lives}', tournamentState?.lives.toString() || '0')}</p>}
            {canRetry ? <button onClick={()=>{playSoundEffect(clickAudioRef); retryTournamentMatch()}} className={btn}>{T.retryMatch}</button> : <button onClick={() => {playSoundEffect(clickAudioRef); setGameState('menu')}} className={btn}>{isTournamentEnd ? T.tournamentOver : T.playAgain}</button>}
            </div>;
    }
    if (gameState === 'tournamentTransition') {
        return <div className={base}><h1 className="text-6xl font-extrabold tracking-wider">{T.matchWon}</h1><p className="mt-2 text-2xl font-mono">{score.player} - {score.ai}</p><button onClick={() => {playSoundEffect(clickAudioRef); startNextTournamentMatch()}} className={btn}>{T.nextMatch}</button></div>;
    }
    return null;
  };

  const T = translations[language];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 font-sans select-none">
       {/* Preload audio files */}
       <audio ref={clickAudioRef} src="https://cdn.pixabay.com/audio/2022/03/15/audio_243194a87a.mp3" preload="auto"></audio>
       <audio ref={explosionAudioRef} src="https://cdn.pixabay.com/audio/2022/10/13/audio_51088339f4.mp3" preload="auto"></audio>
       <audio ref={erikaAudioRef} src="https://archive.org/download/GermanMarsches/18-Erika.mp3" preload="auto"></audio>
       <audio ref={belarusAudioRef} src="https://upload.wikimedia.org/wikipedia/commons/6/63/My_Belarusy.ogg" preload="auto"></audio>
       <audio ref={sovietAudioRef} src="https://upload.wikimedia.org/wikipedia/commons/1/19/State_Anthem_of_the_USSR_%281977_Vocal%29.ogg" preload="auto"></audio>
       <audio ref={franceAudioRef} src="https://cdn.pixabay.com/audio/2022/05/29/audio_343945a828.mp3" preload="auto"></audio>
       <audio ref={palestineAudioRef} src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Mawtini.ogg" preload="auto"></audio>

       <style>{`
          @keyframes floatUp { 0% { transform: translateY(10px) scale(0.9); opacity: 0; } 10% { transform: translateY(0) scale(1); opacity: 1; } 90% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-10px) scale(0.9); opacity: 0; } }
          .animate-float-up { animation: floatUp 3s ease-out forwards; }
          @keyframes pulse-fuchsia { 0%, 100% { filter: drop-shadow(0 0 3px #f0f); } 50% { filter: drop-shadow(0 0 7px #f0f); } }
          @keyframes pulse-lime { 0%, 100% { filter: drop-shadow(0 0 3px #0f0); } 50% { filter: drop-shadow(0 0 7px #0f0); } }
          .player-paddle-glow { animation: pulse-fuchsia 2.5s infinite ease-in-out; }
          .ai-paddle-glow { animation: pulse-lime 2.5s infinite ease-in-out; }
          .scanlines::after { content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: repeating-linear-gradient(0deg, rgba(0,0,0,0.3), rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px); pointer-events: none; z-index: 25; }
        `}</style>
      <h1 className="text-4xl font-bold text-cyan-300 mb-4" style={{ textShadow: "0 0 5px #0ff, 0 0 10px #0ff" }}>{T.title}</h1>
      <div className="relative bg-black border-4 border-cyan-400 cursor-none overflow-hidden scanlines" style={{ width: GAME_WIDTH, height: GAME_HEIGHT, boxShadow: '0 0 15px rgba(0, 255, 255, 0.6), 0 0 25px rgba(0, 255, 255, 0.4), inset 0 0 10px rgba(0, 255, 255, 0.4)', transform: `translate(${shake > 1 ? (Math.random() - 0.5) * shake : 0}px, ${shake > 1 ? (Math.random() - 0.5) * shake : 0}px)` }}>
        {getOverlay()}
        {goalFlash && <div className="absolute inset-0 z-50" style={{ backgroundColor: goalFlash }}></div>}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 z-0"> <StarOfDavid color="#ff0055" size={200} /> </div>
        {ripples.map(r => <div key={r.id} className="absolute rounded-full border-2" style={{ borderColor: languageEffects[language].rippleColor, left: r.x, top: r.y, width: r.radius * 2, height: r.radius * 2, opacity: r.opacity, transform: 'translate(-50%, -50%)', zIndex: 5 }} />)}
        {shockwaves.map(s => <div key={s.id} className="absolute rounded-full border-cyan-300" style={{ left: s.x, top: s.y, width: s.radius * 2, height: s.radius * 2, opacity: s.opacity, borderWidth: `${s.thickness}px`, transform: 'translate(-50%, -50%)', zIndex: 6 }}/>)}
        {particles.map(p => <div key={p.id} className="absolute bg-cyan-300/80 rounded-full" style={{ left: p.x, top: p.y, width: p.size, height: p.size, opacity: p.life/60, transform: 'translate(-50%, -50%)', zIndex: 20 }}/>)}
        {playerMessage && <div key={playerMessage.id} className="absolute text-white text-xl font-bold animate-float-up" style={{ top: playerPaddleY - 30, left: PADDLE_MARGIN + PADDLE_WIDTH + 10, zIndex: 15, textShadow: '2px 2px 4px #000' }}>{playerMessage.text}</div>}
        {aiMessage && <div key={aiMessage.id} className="absolute text-white text-xl font-bold animate-float-up" style={{ top: aiPaddleY - 30, right: PADDLE_MARGIN + PADDLE_WIDTH + 10, zIndex: 15, textShadow: '2px 2px 4px #000' }}>{aiMessage.text}</div>}
        {trail.map((p, i) => <div key={i} className="absolute bg-yellow-300/50 rounded-full" style={{ left: p.x, top: p.y, width: (i/TRAIL_LENGTH)*BALL_SIZE, height: (i/TRAIL_LENGTH)*BALL_SIZE, opacity: i/TRAIL_LENGTH, transform: 'translate(-50%, -50%)', zIndex: 9 }} />)}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-10 border-cyan-400/50 z-10" style={{height: GOAL_HEIGHT, borderTopWidth: '4px', borderBottomWidth: '4px', borderRightWidth: '4px'}} />
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-10 border-cyan-400/50 z-10" style={{height: GOAL_HEIGHT, borderTopWidth: '4px', borderBottomWidth: '4px', borderLeftWidth: '4px'}} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-cyan-400 opacity-20 z-10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-cyan-400 rounded-full opacity-20 z-10"></div>
        <div className="absolute bg-fuchsia-500 rounded-sm z-10 player-paddle-glow" style={{ width: PADDLE_WIDTH, height: playerPaddleHeight, top: playerPaddleY, left: PADDLE_MARGIN }} />
        <div className="absolute bg-lime-400 rounded-sm z-10 ai-paddle-glow" style={{ width: PADDLE_WIDTH, height: AI_PADDLE_HEIGHT, top: aiPaddleY, right: PADDLE_MARGIN }} />
        <div className={`absolute rounded-full z-10 transition-all duration-100 ${ballFlash ? 'bg-white' : 'bg-yellow-300'}`} style={{ width: BALL_SIZE, height: BALL_SIZE, top: ball.y, left: ball.x, filter: `drop-shadow(0 0 ${ballFlash ? 8 : 4}px #ff0)` }} />
      </div>
      <div className="flex justify-between items-center text-white font-bold text-5xl mt-4" style={{ width: GAME_WIDTH }}>
          <div className="text-center w-1/3 relative"><span className="text-2xl block text-cyan-400">{T.player}</span>{score.player}<Flag country={playerFlag} className="absolute -left-4 top-1/2 -translate-y-1/2 w-16 h-10 opacity-50"/></div>
          <div className="text-center w-1/3 font-mono text-4xl">{gameMode === 'tournament' && tournamentState ? `${T.round} ${tournamentState.round}/3` : formatTime(timer)}</div>
          <div className="text-center w-1/3 relative"><span className="text-2xl block text-cyan-400">{T.ai}</span>{score.ai}<Flag country={currentAiFlag} className="absolute -right-4 top-1/2 -translate-y-1/2 w-16 h-10 opacity-50"/></div>
      </div>
    </div>
  );
};

export default App;
