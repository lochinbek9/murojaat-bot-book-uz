const TelegramBot = require('node-telegram-bot-api');

// Bot tokenini Telegramdan olingan token bilan almashtiring
const token = '7784332267:AAG8JtaOMnuzEzhpNcVS19x1RbGotqsb8B0';
const bot = new TelegramBot(token, {polling: true });

// Adminlarning chat IDlari ro'yxati
const adminChatIds = ['5461253830']; // Adminlarning chat IDlarini qo'shing

// Foydalanuvchi holatini saqlash uchun ob'ekt
const userState = {};

// Bot ishga tushganda
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Xush kelibsiz! Quyidagi tugmalardan birini tanlang:", {
    reply_markup: {
      keyboard: [['Murojaat'], ['Talab'], ['Taklif']],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
});

// Tugmalar bosilganda
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Tugma bosilganini aniqlash
  if (['Murojaat', 'Talab', 'Taklif'].includes(text)) {
    userState[chatId] = { type: text, step: 'waiting_for_message' };
    bot.sendMessage(chatId, `${text}ingizni yozing:`);
    return;
  }

  // Foydalanuvchi murojaatni yozganda
  if (userState[chatId] && userState[chatId].step === 'waiting_for_message') {
    const messageType = userState[chatId].type;
    const userMessage = text;

    // Adminlarga xabar yuborish
    adminChatIds.forEach((adminId) => {
      bot.sendMessage(
        adminId,
        `Yangi ${messageType.toLowerCase()}:\nFoydalanuvchi: ${msg.from.first_name} (${chatId})\nXabar: ${userMessage}`,
        {
          reply_markup: {
            inline_keyboard: [[
              {
                text: 'Javob berish',
                callback_data: `reply_${chatId}_${messageType}`,
              },
            ]],
          },
        }
      );
    });

    bot.sendMessage(chatId, `${messageType}ingiz qabul qilindi! Adminlar tez orada ko'rib chiqadi.`);
    delete userState[chatId]; // Holatni tozalash
    return;
  }

  // Agar xabar noma'lum bo'lsa
  if (text !== '/start') {
    bot.sendMessage(chatId, "Iltimos, quyidagi tugmalardan birini tanlang:", {
      reply_markup: {
        keyboard: [['Murojaat'], ['Talab'], ['Taklif']],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }
});

// Admin javob berish tugmasini bosganda
bot.on('callback_query', (callbackQuery) => {
  const data = callbackQuery.data;
  const adminChatId = callbackQuery.message.chat.id;

  if (data.startsWith('reply_')) {
    const [, userChatId, messageType] = data.split('_');
    userState[adminChatId] = { step: 'waiting_for_reply', userChatId, messageType };
    bot.sendMessage(adminChatId, `Foydalanuvchiga ${messageType.toLowerCase()} bo'yicha javobingizni yozing:`);
  }
});

// Adminning javobini qabul qilish
bot.on('message', (msg) => {
  const adminChatId = msg.chat.id;
  if (userState[adminChatId] && userState[adminChatId].step === 'waiting_for_reply') {
    const userChatId = userState[adminChatId].userChatId;
    const messageType = userState[adminChatId].messageType;
    const reply = msg.text;

    // Foydalanuvchiga javob yuborish
    bot.sendMessage(userChatId, `Sizning ${messageType.toLowerCase()}ingizga admin javobi:\n${reply}`);
    bot.sendMessage(adminChatId, `Javobingiz foydalanuvchiga yuborildi!`);

    delete userState[adminChatId]; // Holatni tozalash
  }
});

console.log('Bot ishga tushdi...');