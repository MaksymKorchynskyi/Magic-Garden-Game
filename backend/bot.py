from aiogram import Bot, Dispatcher
from aiogram.filters import Command
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from aiogram import F

# Налаштування бота (замініть на свої значення)
BOT_TOKEN = ''
WEBAPP_URL = ''

# Ініціалізація бота
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

def get_main_keyboard():
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(
                text="Відкрити додаток",
                web_app=WebAppInfo(url=WEBAPP_URL)
            )]
        ],
        resize_keyboard=True,
        one_time_keyboard=False
    )
    return keyboard

@dp.message(Command("start"))
async def cmd_start(message: Message):
    await message.answer(
        "Ласкаво просимо!\nНатисніть кнопку нижче, щоб відкрити додаток:",
        reply_markup=get_main_keyboard()
    )

@dp.message(F.text & ~F.text.startswith('/'))
async def handle_text(message: Message):
    await message.answer(
        "Оберіть дію:",
        reply_markup=get_main_keyboard()
    )

async def delete_webhook():
    await bot.delete_webhook(drop_pending_updates=True)

async def main():
    await delete_webhook()
    print("Бот запущений...")
    await dp.start_polling(bot)

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
