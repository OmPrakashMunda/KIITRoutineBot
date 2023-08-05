const TelegramBot = require('node-telegram-bot-api');
const mysql = require('mysql');
const moment = require('moment-timezone');

const timezone = 'Asia/Kolkata';

function convertToFullDayName(abbreviatedDay) {
  const dayMapping = {
    'mon': 'Monday',
    'tue': 'Tuesday',
    'wed': 'Wednesday',
    'thu': 'Thursday',
    'fri': 'Friday',
    'sat': 'Saturday',
    'sun': 'Sunday'
  };

  return dayMapping[abbreviatedDay] || 'Invalid day';
}

const bot = new TelegramBot('TELEGRAM_BOT_API', { polling: true });

const dbConfig = {
  host: 'localhost',
  user: 'kiit_bot',
  password: 'GyRC3J4FDhGwxpxF',
  database: 'kiit_bot',
};

const pool = mysql.createPool(dbConfig);

const tempUserDetails = {};
const greetings = ["/start", "hello", "hi", "hey", "hola", "howdy", "hiya", "yo", "hii", "helloo", "hellooo", "heyy", "hey there", "hi there", "hii there"];
const tcpp = `
**Routine Bot - Terms & Conditions**

1. Accuracy of Information:
The information provided by Routine Bot is for general reference only and may not always be accurate or up-to-date. Users are advised to cross-check important details with reliable sources.

2. User Responsibilities:
Users must use Routine Bot responsibly and refrain from misuse, harassment, or any illegal activities. The bot is intended for personal, non-commercial use only.

3. Property of ITJUPITER:
Routine Bot is the proprietary property of ITJUPITER Private Limited. All rights and intellectual property belong to ITJUPITER.

4. Mentor Referral:
Users are encouraged to refer to their mentors for guidance and verification of information provided by Routine Bot.

5. Limitation of Liability:
ITJUPITER shall not be liable for any damages arising from the use or inability to use Routine Bot or its content.

**Routine Bot - Privacy Policy**

1. Personal Information:
Routine Bot may request and store minimal user information for a personalized experience. This data will be handled in accordance with our Privacy Policy.

2. Data Protection:
ITJUPITER ensures reasonable measures to protect user data but cannot guarantee absolute security.

3. Third-Party Access:
User data will not be shared with third parties without prior consent, except as required by law.

4. Data Retention:
User data will be retained as long as necessary for the purposes mentioned in our Privacy Policy.

5. Changes to Policy:
ITJUPITER reserves the right to update this Privacy Policy, and users will be notified of any material changes.

By using Routine Bot, you agree to abide by these Terms & Conditions and acknowledge the Privacy Policy. If you do not agree, please refrain from using the bot.
`;

const contact = "Email: 2305467@kiit.ac.in\nPhone Number: +91 9341818031";

function insertUserDetails(chatId, name, roll, section) {
  const query = 'INSERT INTO users (chatId, name, roll, section) VALUES (?, ?, ?, ?)';
  pool.query(query, [chatId, name, roll, section], (err, results) => {
    if (err) {
      console.error('Oops! There was an error inserting user details into the database:', err);
    } else {
      console.log('User details inserted successfully!');
    }
  });
}

function askForName(chatId) {
  bot.sendMessage(chatId, 'Hello! Please provide your name (Eg: Om Prakash):');
  tempUserDetails[chatId] = { step: 1 }; // Step 1: Asking for name
}

function askForRoll(chatId) {
  bot.sendMessage(chatId, 'Great! Please provide your roll number (Eg: 2305467):');
  tempUserDetails[chatId].step = 2; // Move to step 2: Asking for roll
}

function askForSection(chatId) {
  bot.sendMessage(chatId, 'Almost there! Please provide your section (Eg: A28):');
  tempUserDetails[chatId].step = 3; // Move to step 3: Asking for section
}

function askForOtherSection(chatId) {
  bot.sendMessage(chatId, 'Sure! Please provide the section for which you want to see classes:');
  tempUserDetails[chatId].step = 5;
}

function validateRoll(roll) {
  return /^[\w\s]+\d+$/.test(roll);
}

function validateSection(section) {
  return /^[a-z]\d+$/.test(section);
}

function askIfSeeClasses(chatId, section) {
  bot.sendMessage(chatId, 'Hello again! Please select a day to see your classes or any option:', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Today', callback_data: 'today' },
          { text: 'Tomorrow', callback_data: 'tomorrow' }
        ],
        [
          { text: 'Monday', callback_data: 'mon' },
          { text: 'Tuesday', callback_data: 'tue' }
        ],
        [
          { text: 'Wednesday', callback_data: 'wed' },
          { text: 'Thursday', callback_data: 'thu' }
        ],
        [
          { text: 'Friday', callback_data: 'fri' },
        ],
        [
          { text: 'T&C / Privacy Policy', callback_data: 'tcpp' },
        ],
        [
          { text: 'Contact', callback_data: 'contact' },
        ],
      ]
    }
  });
  tempUserDetails[chatId] = { step: 4, section: section }; // Step 4: Asking if the user wants to see classes
}

function queryUserDetails(chatId, callback) {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Oops! There was an error connecting to the database:', err);
      return;
    }

    const query = 'SELECT * FROM users WHERE chatId = ?';

    connection.query(query, [chatId], (err, results) => {
      if (err) {
        console.error('Oops! There was an error querying the database:', err);
      } else {
        if (results.length === 0) {
          // User does not exist
          callback(false);
        } else {
          // User exists
          callback(true, results[0]);
        }
      }
      connection.release();
    });
  });
}

function getClassData(chatId, userDetails, day) {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Oops! There was an error connecting to the database:', err);
      return;
    }

    const classesQuery = 'SELECT * FROM class WHERE section = ? AND day = ? AND active = 1';
    connection.query(classesQuery, [userDetails.section, day], (err, classResults) => {
      if (err) {
        console.error('Oops! There was an error querying the database:', err);
      } else {
        let replyMessage = 'Here are your classes for ' + convertToFullDayName(day) + ':\n';
        if (classResults.length > 0) {
          for (const classData of classResults) {
            replyMessage += `\nSubject: ${classData.subject}\n`;
            replyMessage += `Time: ${classData.start_time} - ${classData.end_time}\n`;
            replyMessage += `Campus: ${classData.campus_number}\n`;
            replyMessage += `Room: ${classData.room_number}\n`;
            replyMessage += `Direction: ${classData.direction}\n`;
            replyMessage += '-----------------------\n';
          }
        } else {
          replyMessage = 'No classes found for your section on ' + convertToFullDayName(day) + '.';
        }

        let nearestClass = null;
        const now = moment().tz(timezone);
        const currentTime = moment(now.format('HH:mm'), 'HH:mm'); // Current time in format hh:mm
        for (const classData of classResults) {
          const startTime = moment(classData.start_time, 'HH:mm');
          if (startTime.isSameOrAfter(currentTime)) {
            if (!nearestClass || startTime.isBefore(moment(nearestClass.start_time, 'HH:mm'))) {
              nearestClass = classData;
            }
          }
        }

        if (nearestClass && day === moment().tz(timezone).format('ddd').toLocaleLowerCase()) {
          const timeLeft = moment(nearestClass.start_time, 'HH:mm').diff(now, 'minutes');
          let replyMessageNC = '\nYour nearest class is:\n';
          replyMessageNC += `Subject: ${nearestClass.subject}\n`;
          replyMessageNC += `Time: ${nearestClass.start_time} - ${nearestClass.end_time}\n`;
          replyMessageNC += `Campus: ${nearestClass.campus_number}\n`;
          replyMessageNC += `Room: ${nearestClass.room_number}\n`;
          replyMessageNC += `Direction: ${nearestClass.direction}\n`;

          if (timeLeft < 15) {
            //replyMessageNC += '\nHurry up! Time is running out! You better start running! 🏃‍♂️';
          }

          bot.sendMessage(chatId, replyMessageNC);
        } else if (day === moment().tz(timezone).format('ddd').toLocaleLowerCase()) {
          bot.sendMessage(chatId, '\nNo upcoming classes for your section today.');
        }

        setTimeout(() => {
          bot.sendMessage(chatId, replyMessage);
        }, 500);
      }
      connection.release();
    });
  });
}

// Main event listener for incoming messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text.toLowerCase();

  // Greetings and user details handling
  if (greetings.includes(messageText)) {
    queryUserDetails(chatId, (userExists, userDetails) => {
      if (!userExists) {
        askForName(chatId);
      } else {
        if (userDetails.name && userDetails.roll && userDetails.section) {
          askIfSeeClasses(chatId, userDetails.section);
        } else {
          askForName(chatId);
        }
      }
    });
  } else if (messageText === '/os') {
    queryUserDetails(chatId, (userExists, userDetails) => {
      if (userExists) {
        askForOtherSection(chatId);
      } else {
        bot.sendMessage(chatId, 'Please provide your name, roll, and section first. Use /start to begin.');
      }
    });
  } else {
    const userDetails = tempUserDetails[chatId];

    if (userDetails && userDetails.step) {
      switch (userDetails.step) {
        case 1:
          userDetails.name = messageText;
          askForRoll(chatId);
          break;
        case 2:
          if (validateRoll(messageText)) {
            userDetails.roll = messageText;
            askForSection(chatId);
          } else {
            bot.sendMessage(chatId, 'Invalid roll number format. Please provide your roll number (Eg: Om 2305467):');
          }
          break;
        case 3:
          if (validateSection(messageText)) {
            userDetails.section = messageText;
            insertUserDetails(chatId, userDetails.name, userDetails.roll, userDetails.section);
            askIfSeeClasses(chatId, userDetails.section);
          } else {
            bot.sendMessage(chatId, 'Invalid section format. Please provide your section (Eg: A28):');
          }
          break;
        case 5:
          queryUserDetails(chatId, (userExists, userDetails) => {
            if (userExists) {
              getClassData(chatId, { ...userDetails, section: messageText }, moment().tz(timezone).format('ddd').toLocaleLowerCase());
            }
          });
          break;
      }
    }
  }
});
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const days = ["today", "tomorrow", "mon", "tue", "wed", "thu", "fri"];

  if (days.includes(data)) {
    queryUserDetails(chatId, (userExists, userDetails) => {
      if (userExists) {
        const now = moment().tz(timezone);
        let day;

        switch (data) {
          case 'today':
            day = now.format('ddd').toLocaleLowerCase();
            break;
          case 'tomorrow':
            day = now.add(1, 'day').format('ddd').toLocaleLowerCase();
            break;
          case 'mon':
          case 'tue':
          case 'wed':
          case 'thu':
          case 'fri':
            day = data;
            break;
          default:
            bot.sendMessage(chatId, 'Invalid day selection.');
            return;
        }

        getClassData(chatId, userDetails, day);
      }
    });
  }
});


bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const days = ["tcpp", "contact"];

  if (days.includes(data)) {
    queryUserDetails(chatId, (userExists, userDetails) => {
      if (userExists) {
        switch (data) {
          case 'tcpp':
            bot.sendMessage(chatId, tcpp);  
            break;
          case 'contact':
            bot.sendMessage(chatId, contact); 
            break;
          default:
            bot.sendMessage(chatId, 'Invalid selection.');
            return;
        }
      }
    });
  }
});
