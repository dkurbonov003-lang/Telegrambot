//======Глобальная часть=======
const TelegramBot = require('node-telegram-bot-api');
const https = require('https');
const axios = require('axios'); // для OpenRouter API
const translate = require('@vitalets/google-translate-api'); // Переводчик

const password = 'daler0000';
const userState = {};


const token = '8290147809:AAEQ1-3LjMH1qFLabE73H1NAxvIPNil7n7M'; // Токен бота
const bot = new TelegramBot(token, { polling: true });

const OPENROUTER_KEY = ''; // Апи ключ ИИ
let awaitingAmount = {};

console.log('🤖 Бот запущен...');

// ===== /start =====
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Салам Алечкум Хавволъа, Я ДалерБот\nНажми на /menu, чтобы открыть меню.');
});

// ===== /menu =====
bot.onText(/\/menu/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Выбери действие:', {
    reply_markup: {
      keyboard: [
        ['Привет', 'Время'],
        ['Помощь', 'Инфо'],
        ['🎭 Мафия', '🎯 Крокодил'],
        ['🎲 Рандомайзер', '💵 Конвертер USD ↔ TJS'],
        ['Доступ к Боту']
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

// ===== Основной обработчик сообщений =====
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.toLowerCase();
  if (text.startsWith('/')) return;

  // === Конвертер USD ↔ TJS ===
  if (awaitingAmount[chatId]) {
    const parts = text.split(' ');
    if (parts.length === 2) {
      const amount = parseFloat(parts[0]);
      const currency = parts[1].toUpperCase();

      if (isNaN(amount)) {
        bot.sendMessage(chatId, '❌ Неверная сумма. Попробуй снова.');
        return;
      }

      const url = 'https://open.er-api.com/v6/latest/USD';
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const rates = JSON.parse(data);
            const usdToTjs = rates.rates.TJS;

            let result;
            if (currency === 'USD') result = `${amount} USD ≈ ${(amount * usdToTjs).toFixed(2)} TJS`;
            else if (currency === 'TJS') result = `${amount} TJS ≈ ${(amount / usdToTjs).toFixed(2)} USD`;
            else result = '❌ Неверная валюта. Используй USD или TJS.';

            bot.sendMessage(chatId, result);
            delete awaitingAmount[chatId];
          } catch {
            bot.sendMessage(chatId, '❌ Ошибка получения курса.');
          }
        });
      }).on('error', () => {
        bot.sendMessage(chatId, '❌ Не удалось подключиться к серверу валют.');
      });
    } else {
      bot.sendMessage(chatId, '⚠️ Ты Дурак Чтоли сказали же точно как тут написать "1100 USD" или "10000 TJS".');
    }
    return;
  }

  // === Команды ===
  if (text === 'привет') {
     bot.sendMessage(chatId, 'Тормози да какой привет? Салам Алейкум братуха!');
     return;
  }
  else if (text === 'время') { bot.sendMessage(chatId, `⏰ В Душанбе сейчас ${new Date().toLocaleTimeString()}`);
  return;
}
  else if (text === 'помощь') { bot.sendMessage(chatId, 'Команды:\n/start\n/menu\nПривет\nВремя\n🎭 Мафия\n🎯 Крокодил\n🎲 Рандомайзер\n💵 Конвертер USD ↔ TJS\nЕсли Нужен Переводчик то Напиши "перевод:" и Текст\nЕсли Нужен ИИ Ассистент то напиши "Вопрос:" и Текст.');
    return;
  }
  else if (text === 'инфо') { bot.sendMessage(chatId, 'Салам Алейкум, Этого Бота Создал чел по имени Далер этот Бот мало что умеет как и его создатель поэтому многого от меня не ожидайте просто кайфуйте.');
return;
  }
  // === Мафия ===
  else if (text === '🎭 мафия') {
    bot.sendMessage(chatId, '🎲 Сколько вас братишки будет? (минимум 3)');

    bot.once('message', (msg2) => {
      const count = parseInt(msg2.text);
      if (isNaN(count) || count < 3) {
        bot.sendMessage(chatId, '❌ Введи корректное число (минимум 3 игрока).');
        return;
      }

      bot.sendMessage(chatId, `Если IQ позволяет, нажми "Зарегистрироваться", пока не будет ${count} игроков.`, {
        reply_markup: { keyboard: [['Зарегистрироваться']], resize_keyboard: true }
      });

      const players = [];
      const rolesBase = ['Мафия', 'Доктор', 'Комиттар Кассани', 'Мирный житель', 'Мирный житель', 'Мирный житель'];
      const roles = [];
      for (let i = 0; i < count; i++) roles.push(rolesBase[i] || 'Мирный житель');
      const shuffled = roles.sort(() => Math.random() - 0.5);

      const collector = (msg3) => {
        if (msg3.text === 'Зарегистрироваться') {
          if (!players.find(p => p.id === msg3.chat.id)) {
            players.push({ id: msg3.chat.id, name: msg3.from.first_name });
            bot.sendMessage(msg3.chat.id, `✅
              Ты зарегистрирован! (${players.length}/${count})`);

            if (players.length === count) {
              bot.removeListener('message', collector);
              for (let i = 0; i < players.length; i++) {
                const player = players[i];
                bot.sendMessage(player.id, `🎭 Твоя роль: ${shuffled[i]}`);
              }

              bot.sendMessage(chatId, 'Все роли розданы! Игра начинается!');
              bot.sendMessage(chatId, 'Главное меню:', {
                reply_markup: {
                  keyboard: [
                    ['Привет', 'Время'],
                    ['Помощь', 'Инфо'],
                    ['🎭 Мафия', '🎯 Крокодил'],
                    ['💵 Конвертер USD ↔ TJS']
                  ],
                  resize_keyboard: true
                }
              });
            }
          }
        }
      };
      bot.on('message', collector);
    });
  }

  // === Крокодил ===
  else if (text === '🎯 крокодил') {
    const words = ['Самолёт','Телефон','Кофе','Собака','Банан','Танец','Учитель','Пират','Космонавт','Рыбак','Книга','Молния','Музыка','Пицца','Призрак','Футбол','Гора','Дракон','Карандаш','Пылесос'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    bot.sendMessage(chatId, `🎯 Твоё слово: <b>${randomWord}</b>\n🤫 Объясни его без слов!`, { parse_mode: 'HTML' });
  return;
  }


// === Рандомайзер ===
else if (text === '🎲 рандомайзер') {
  bot.sendMessage(chatId, 'Введи диапазон чисел (например: 1-100)');
  userState[chatId] = 'waiting_range';
  return;
}

if (userState[chatId] === 'waiting_range') {
  const range = text.match(/(\d+)\s*-\s*(\d+)/);
  if (range) {
    const min = parseInt(range[1]);
    const max = parseInt(range[2]);
    if (min < max) {
      const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
      bot.sendMessage(chatId, `🎲 Твоё брат случайное число: ${randomNumber}`);
    } else {
      bot.sendMessage(chatId, '❌ Первое число должно быть меньше второго.');
    }
  } else {
    bot.sendMessage(chatId, '⚠️ Введи в формате: 10-200');
  }

  delete userState[chatId]; // сбрасываем состояние
  return;
}

  // === Конвертер ===
  else if (text === '💵 конвертер usd ↔ tjs') {
    bot.sendMessage(chatId, 'Напиши сумму и направление (например: "1100 USD" или "10000 TJS"):');
    awaitingAmount[chatId] = true;
  return;
  }

  // === Искусственный интеллект ===
  else if (text.startsWith('вопрос')) {
    const question = text.slice(8).trim();
    bot.sendMessage(chatId, '🤖 Думаю над ответом...');
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: question }]
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const answer = response.data.choices[0].message.content;
      bot.sendMessage(chatId, `💬 ${answer}`);
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, '⚠️ Извини Брат Токены на ИИ платные, а у создателя этого бота денег нет.');
    }
  return;
  }

//=====Переводчик=====
  else if (text.startsWith('перевод')) {
  const input = msg.text.slice(8).trim(); // убираем "перевод:"

  bot.sendMessage(chatId, '🌐 Анализ...');

  try {
    // Простая проверка: есть ли русские буквы
    const isRussian = /[а-яА-ЯёЁ]/.test(input);
    const targetLang = isRussian ? 'en' : 'ru';

    const res = await translate(input, { to: targetLang });
    bot.sendMessage(chatId, `💬 Перевод (${targetLang.toUpperCase()}): ${res.text}`);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, '⚠️ Ошибка при переводе.');
  }
return;
}

//=====Общение=====
else if (text.startsWith('кто ты')) {
  bot.sendMessage(chatId, 'Ну во первых базарь нормально, а во вторых я тест бот от самого Далера.\nТы брат лучше не хами а давай в крокодила игарай.');
return;
}


else if (text.startsWith('что ты можешь') ||
text.startsWith('что ты можешь?') ||
text.startsWith('че ты можешь') ||
text.startsWith('че ты можешь?')) {
  
  bot.sendMessage(chatId, 'как будто ты до фига че можешь.\nТак то я могу в качестве ИИ служить если напишешь вопрос и текст.\nА так братишка перейди в раздел Помощь и там ищи че тебе надо.');
return;
}


else if (text.startsWith('как дела')) {
  bot.sendMessage(chatId, 'Да Норм в принципе. Че как сам?');
return;
}


else if (text.startsWith('что делаешь') ||
text.startsWith('че делаешь')) {
  bot.sendMessage(chatId, 'да нече не делаю так с тобой базарю разве что')
return;
}


else if (text.startsWith('кто я')) {
  bot.sendMessage(chatId, 'Да я понятие не имею кто ты вообще такой, Ты же не Миладзе что бы я тебя знал.')
return;
}


else if (text.startsWith('пока') ||
text.startsWith('давай пока') ||
text.startsWith('ладно пока') ||
text.startsWith('ладно давай пока')) {
  bot.sendMessage(chatId, 'Давай брат пиши если что на связи.')
return;
}


else if (text.startsWith('на что ты способен')) {
  bot.sendMessage(chatId, 'Так ты давай не дерзи мне, что могу то делаю остальное к ChatGPT.')
return;
}


else if (text.startsWith('расскажи что нибудь') ||
text.startsWith('расскажи че нибудь')) {
  bot.sendMessage(chatId, 'Я тебе не оратор я серьёзный бот. Отвали!')
return;
}


else if (text.startsWith('норм') ||
text.startsWith('нормально') ||
text.startsWith('тоже норм') ||
text.startsWith('норм тоже') ||
text.startsWith('тоже нормально') ||
text.startsWith('нормально тоже')) {
  bot.sendMessage(chatId, 'Ну норм так норм.')
return;
}


else if (text.startsWith('сколько тебе лет')) {
  bot.sendMessage(chatId, 'ты дурак чтоли я же Бот я не рождался конченный ты конечно.')
return;
}

else if (text.startsWith('бля') ||
text.startsWith('иди на хуй') ||
text.startsWith('пошел нахуй') ||
text.startsWith('пошел на хуй') ||
text.startsWith('пошёл нахуй') ||
text.startsWith('пошёл на хуй') ||
text.startsWith('че ахуел') ||
text.startsWith('выебу тебя') ||
text.startsWith('блять') ||
text.startsWith('сука') ||
text.startsWith('пидарас') ||
text.startsWith('пидараз')) {
  bot.sendMessage(chatId, 'Астагфирулла брат зачем материшься оставь да это всё.')
return;
}


else if (text.startsWith('ты лох') ||
text.startsWith('лох')) {
  bot.sendMessage(chatId, 'Иди нахер сам лох')
return;
}


else if (text.startsWith('что ты думаешь про Умара') ||
text.startsWith('че ты думаешь про Умара') ||
text.startsWith('что думаешь про умара') ||
text.startsWith('че думаешь про умара')) {
bot.sendMessage(chatId, 'Умар ЧМО больше о нём нечего сказать не могу')
return;
}


//=====Доступ к Боту=====
if (text === 'доступ к боту') {
  bot.sendMessage(chatId, 'Доступ к Боту имеет только Разработчик. Введи пароль для получение Доступа к Боту....')
userState[chatId] = 'waiting_password';
return;
}
if (userState[chatId] === 'waiting_password') {
  if (text === password) {
    await bot.sendMessage(chatId, 'Доступ разрещен. Добро Пожаловать Далер.');
    delete userState[chatId];
    await bot.sendMessage(chatId, 'dalerkurbonov@MacBook-Daler ~ % node /Users/dalerkurbonov/Documents/TelegramBot/botDesktop\nMusipackage-lock.json\nDownloads\nPicturespackage.\njsonLibraryPublic');
  }
else {
  bot.sendMessage(chatId, 'Неверный Пароль. Доступ Запрещен....')
}
return;
}


else if (text.startsWith('понятно') ||
text.startsWith('ясно')) {
  bot.sendMessage(chatId, 'Молодец Понятливый')
return;
}


else if (text.startsWith('че там') ||
text.startsWith('че там ле')) {
  bot.sendMessage(chatId, 'Не че там. Иди Отсюда дурак.')
return;
}


else if (text.startsWith('че ты')) {
  bot.sendMessage(chatId, 'Не че а ты че')
return;
}


else if (text.startsWith('да я тоже не че') ||
text.startsWith('я тоже не че') ||
text.startsWith('тоже не че') ||
text.startsWith('да тоже не че')) {
  bot.sendMessage(chatId, 'Ну вот и всё тогда')
return;
}

else if (text.startsWith('что всё') ||
text.startsWith('что все') ||
text.startsWith('че всё') ||
text.startsWith('че все')) {
  bot.sendMessage(chatId, 'Слушай давай не даставай меня')
return;
}

else if (text.startsWith('гандон') ||
text.startsWith('гондон')) {
  bot.sendMessage(chatId, 'От гандона слышу!')
return;
}

else if (text.startsWith('Хорошо') ||
text.startsWith('ок') ||
text.startsWith('ладно')) {
  bot.sendMessage(chatId, 'мхм')
return;
}


else {
  bot.sendMessage(chatId, 'Не знаю такой команды обратись к моему разработчику @Далер если духа хватит.');
return;
}
});
