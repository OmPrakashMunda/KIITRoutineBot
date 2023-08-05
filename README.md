# Routine Bot

The Routine Bot is a Telegram bot designed to help students retrieve their class schedules and related information. It interacts with users through text messages and provides them with details about their classes, schedule for specific days, terms & conditions, and privacy policy. The bot requires users to provide their name, roll number, and section for personalized assistance.

## How It Works

1. **Dependencies**: The bot utilizes the `node-telegram-bot-api`, `mysql`, and `moment-timezone` libraries for interacting with Telegram, managing a MySQL database, and handling timezones respectively.

2. **User Details**: The bot prompts users to provide their name, roll number, and section. This information is used to identify the user's class schedule.

3. **Commands and Interactions**:
   - Users can initiate conversations with the bot using greetings like "hello," "hi," "hey," etc., which triggers the process of collecting user details.
   - Users can use the command `/os` to request class details for a different section.
   - Users can interact with the bot through inline keyboards to choose options like viewing classes for today, tomorrow, or specific weekdays.
   - Users can also access the Terms & Conditions and Privacy Policy through relevant inline keyboard options.

4. **Database Interaction**:
   - User details (chatId, name, roll, section) are stored in a MySQL database.
   - Class details (subject, start_time, end_time, campus_number, room_number, direction) are retrieved from the database based on user's section and chosen day.

5. **Class Information**:
   - The bot fetches class data from the database and provides users with information about their classes, including subject, time, campus, room, and direction.
   - Users are informed about their nearest upcoming class, including time remaining if it's within 15 minutes (Still working in this feature).

6. **Terms & Conditions and Privacy Policy**:
   - The bot includes Terms & Conditions and Privacy Policy information that users can access through inline keyboard options.
   - These documents outline the bot's usage terms, user responsibilities, data protection, and more.

7. **Contact Information**:
   - Users can access contact information through an inline keyboard option, providing them with an email address and phone number for inquiries.

## Note

Please note that the README does not include instructions for running the code. To deploy and use the Routine Bot, you need to set up the required dependencies, configure the database, and integrate the bot with the Telegram API.
