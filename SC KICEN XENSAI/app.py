import os
import re
import json
import asyncio
import requests
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass

from telegram import (
    Update, InlineKeyboardButton, InlineKeyboardMarkup,
    LinkPreviewOptions, CopyTextButton, MessageEntity
)
from telegram.ext import Application, CommandHandler, ContextTypes
from telegram.constants import ParseMode
from telegram.error import RetryAfter
from dotenv import load_dotenv
from colorama import init, Fore, Style

init(autoreset=True)
load_dotenv()


async def send_with_retry(send_func, max_retries=3, **kwargs):
    for attempt in range(max_retries):
        try:
            return await send_func(**kwargs)
        except RetryAfter as e:
            wait = e.retry_after
            if attempt < max_retries - 1:
                await asyncio.sleep(wait)
                continue
            raise
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2 ** attempt)
    raise RuntimeError("Max retries exceeded")


@dataclass
class Config:
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "")
    CH_INFO: str = os.getenv("CH_INFO", "")
    NUMBER_BOT: str = os.getenv("NUMBER_BOT", "")
    USERNAME_GAZA: str = os.getenv("USERNAME_GAZA", "")
    PASSWORD_GAZA: str = os.getenv("PASSWORD_GAZA", "")

    def __post_init__(self):
        if not self.BOT_TOKEN:
            raise ValueError("BOT_TOKEN not found in .env")
        if not self.USERNAME_GAZA or not self.PASSWORD_GAZA:
            raise ValueError("USERNAME_GAZA and PASSWORD_GAZA required")


class Database:
    BASE_DIR = Path("database")

    @classmethod
    def init_db(cls):
        cls.BASE_DIR.mkdir(exist_ok=True)
        
        default_files = {
            "groups.json": {"groups": []},
            "sms_history.json": [],
            "bot_messages.json": []
        }
        
        for file, content in default_files.items():
            path = cls.BASE_DIR / file
            if not path.exists():
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(content, f, indent=4, ensure_ascii=False)

    @classmethod
    def load_groups(cls) -> List[str]:
        path = cls.BASE_DIR / "groups.json"
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data.get("groups", [])
            except:
                pass
        return []

    @classmethod
    def save_groups(cls, groups: List[str]):
        path = cls.BASE_DIR / "groups.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"groups": groups}, f, indent=4, ensure_ascii=False)

    @classmethod
    def add_group(cls, group_id: str) -> bool:
        groups = cls.load_groups()
        if group_id not in groups:
            groups.append(group_id)
            cls.save_groups(groups)
            return True
        return False

    @classmethod
    def load_countries(cls) -> Dict:
        path = cls.BASE_DIR / "country.json"
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except:
                pass
        return {}

    @classmethod
    def check_sms_history(cls, phone: str, datetime_str: str) -> bool:
        path = cls.BASE_DIR / "sms_history.json"
        history = []
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    history = json.load(f)
            except:
                pass
        
        sms_id = f"{phone}_{datetime_str}"
        if sms_id in history:
            return True
        
        history.append(sms_id)
        if len(history) > 1000:
            history = history[-1000:]
        
        with open(path, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=4, ensure_ascii=False)
        
        return False

    @classmethod
    def add_bot_message(cls, group_id: str, message_id: int):
        path = cls.BASE_DIR / "bot_messages.json"
        data = []
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except:
                pass
        
        data.append({
            "group_id": group_id,
            "message_id": message_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

    @classmethod
    def get_old_bot_messages(cls, older_than_minutes: int) -> List[Dict]:
        path = cls.BASE_DIR / "bot_messages.json"
        if not path.exists():
            return []
        
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except:
            return []
        
        now = datetime.now(timezone.utc)
        old = []
        for msg in data:
            try:
                ts = datetime.fromisoformat(msg["timestamp"])
                if (now - ts).total_seconds() > older_than_minutes * 60:
                    old.append(msg)
            except:
                pass
        return old

    @classmethod
    def remove_bot_message(cls, group_id: str, message_id: int):
        path = cls.BASE_DIR / "bot_messages.json"
        if not path.exists():
            return
        
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except:
            return
        
        new_data = [m for m in data if not (m["group_id"] == group_id and m["message_id"] == message_id)]
        
        if len(new_data) != len(data):
            with open(path, "w", encoding="utf-8") as f:
                json.dump(new_data, f, indent=4, ensure_ascii=False)


class Utils:
    @staticmethod
    def extract_otp(message: str) -> str:
        patterns = [
            re.compile(r'(?:kode|code|otp|pin|verification)[\s:]*([0-9]{3,8}(?:[- ][0-9]{3,8})?)', re.IGNORECASE),
            re.compile(r'(?:adalah|is|use|gunakan)[\s:]*([0-9]{3,8}(?:[- ][0-9]{3,8})?)', re.IGNORECASE),
            re.compile(r'(?::\s*|\/|\*)?([0-9]{3,8}(?:[- ][0-9]{3,8})?)(?:\.|,|$)'),
            re.compile(r'\b([0-9]{3,8}(?:[- ][0-9]{3,8})?)\b'),
            re.compile(r'#\s*([0-9]{3,8}(?:[- ][0-9]{3,8})?)')
        ]
        for pattern in patterns:
            match = pattern.search(message)
            if match and match[1]:
                return match[1].replace(' ', '-')
        all_numbers = re.findall(r'\b\d{3,8}\b', message)
        if all_numbers:
            for num in reversed(all_numbers):
                if 3 <= len(num) <= 8:
                    return num
        return 'N/A'

    @staticmethod
    def mask_phone(phone: str) -> str:
        if len(phone) >= 8:
            return f"{phone[:4]}•XneT•{phone[-4:]}"
        return phone

    @staticmethod
    def get_service_emoji(service: str) -> str:
        service_lower = service.lower()
        if "whatsapp" in service_lower:
            return "5334998226636390258"
        if "facebook" in service_lower:
            return "5323261730283863478"
        if "instagram" in service_lower:
            return "5319160079465857105"
        if "snapchat" in service_lower:
            return "5330248916224983855"
        if "telegram" in service_lower:
            return "5330237710655306682"
        if "paypal" in service_lower:
            return "5364111181415996352"
        if "tiktok" in service_lower:
            return "5327982530702359565"
        if "discord" in service_lower:
            return "5325612636467903082"
        return "5816769540066906278"

    @staticmethod
    def get_country_by_code(phone: str) -> Optional[Dict]:
        countries = Database.load_countries()
        if not countries:
            return None
        sorted_codes = sorted(countries.keys(), key=len, reverse=True)
        for code in sorted_codes:
            if phone.startswith(code):
                return countries[code]
        return None


class OTPFetcher:
    def __init__(self, config: Config):
        self.config = config
        self.base_url = "http://144.217.71.192"
        self.login_url = f"{self.base_url}/ints/login"
        self.signin_url = f"{self.base_url}/ints/signin"
        self.data_url = f"{self.base_url}/ints/agent/res/data_smscdr.php"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate',
            'X-Requested-With': 'XMLHttpRequest'
        })
        self.running = True
        self.last_sms_time = None
        self.sesskey = None

    def _solve_math(self, html: str) -> str:
        match = re.search(r'(\d+)\s*\+\s*(\d+)', html)
        if match:
            return str(int(match.group(1)) + int(match.group(2)))
        return "0"

    async def _extract_sesskey(self) -> bool:
        try:
            resp = await asyncio.to_thread(self.session.get, f"{self.base_url}/ints/agent/SMSCDRStats", timeout=30)
            if resp.status_code != 200:
                return False
            html = resp.text
            patterns = [
                r'sesskey["\']?\s*[=:]\s*["\']([^"\']+)["\']',
                r'var\s+sesskey\s*=\s*["\']([^"\']+)',
                r'name="sesskey"\s+value="([^"]+)"',
                r'data-sesskey=["\']([^"\']+)',
                r'sesskey=([a-zA-Z0-9+=]+)&?',
            ]
            for pattern in patterns:
                match = re.search(pattern, html)
                if match:
                    self.sesskey = match.group(1)
                    return True
            for cookie in self.session.cookies:
                if 'sesskey' in cookie.name.lower():
                    self.sesskey = cookie.value
                    return True
            self.sesskey = "Q05RR0FSUUdBUw=="
            return True
        except Exception as e:
            print(f"Error extracting sesskey: {e}")
            return False

    async def _login(self):
        while True:
            try:
                res_page = await asyncio.to_thread(self.session.get, self.login_url, timeout=30)
                if res_page.status_code != 200:
                    await asyncio.sleep(5)
                    continue
                ans = self._solve_math(res_page.text)
                payload = {'username': self.config.USERNAME_GAZA, 'password': self.config.PASSWORD_GAZA, 'capt': ans}
                resp = await asyncio.to_thread(self.session.post, self.signin_url, data=payload, timeout=30)
                if resp.status_code == 200:
                    if await self._extract_sesskey():
                        os.system('cls' if os.name == 'nt' else 'clear')
                        print(f"{Fore.GREEN}[]════════[] LOGIN SUCCESSFULLY []════════[]{Style.RESET_ALL}")
                        return
                    else:
                        print("Failed to extract sesskey, retrying...")
                        await asyncio.sleep(5)
                else:
                    await asyncio.sleep(5)
            except Exception as e:
                print(f"Login error: {e}")
                await asyncio.sleep(5)

    def _fetch_sms(self):
        now_utc = datetime.now(timezone.utc)
        target_date = now_utc.strftime('%Y-%m-%d')
        params = {
            'fdate1': f'{target_date} 00:00:00',
            'fdate2': f'{target_date} 23:59:59',
            'frange': '',
            'fclient': '',
            'fnum': '',
            'fcli': '',
            'fgdate': '',
            'fgmonth': '',
            'fgrange': '',
            'fgclient': '',
            'fgnumber': '',
            'fgcli': '',
            'fg': '0',
            'sesskey': self.sesskey or "Q05RR0FSUUdBUw==",
            'sEcho': '1',
            'iColumns': '9',
            'sColumns': ',,,,,,,,',
            'iDisplayStart': '0',
            'iDisplayLength': '25',
            'mDataProp_0': '0',
            'sSearch_0': '',
            'bRegex_0': 'false',
            'bSearchable_0': 'true',
            'bSortable_0': 'true',
            'mDataProp_1': '1',
            'sSearch_1': '',
            'bRegex_1': 'false',
            'bSearchable_1': 'true',
            'bSortable_1': 'true',
            'mDataProp_2': '2',
            'sSearch_2': '',
            'bRegex_2': 'false',
            'bSearchable_2': 'true',
            'bSortable_2': 'true',
            'mDataProp_3': '3',
            'sSearch_3': '',
            'bRegex_3': 'false',
            'bSearchable_3': 'true',
            'bSortable_3': 'true',
            'mDataProp_4': '4',
            'sSearch_4': '',
            'bRegex_4': 'false',
            'bSearchable_4': 'true',
            'bSortable_4': 'true',
            'mDataProp_5': '5',
            'sSearch_5': '',
            'bRegex_5': 'false',
            'bSearchable_5': 'true',
            'bSortable_5': 'true',
            'mDataProp_6': '6',
            'sSearch_6': '',
            'bRegex_6': 'false',
            'bSearchable_6': 'true',
            'bSortable_6': 'true',
            'mDataProp_7': '7',
            'sSearch_7': '',
            'bRegex_7': 'false',
            'bSearchable_7': 'true',
            'bSortable_7': 'true',
            'mDataProp_8': '8',
            'sSearch_8': '',
            'bRegex_8': 'false',
            'bSearchable_8': 'true',
            'bSortable_8': 'true',
            'sSearch': '',
            'bRegex': 'false',
            'iSortCol_0': '0',
            'sSortDir_0': 'desc',
            'iSortingCols': '1',
            '_': str(int(datetime.now().timestamp() * 1000))
        }
        headers = {'Referer': f"{self.base_url}/ints/agent/SMSCDRStats"}
        try:
            resp = self.session.get(self.data_url, params=params, headers=headers, timeout=30)
            if resp.status_code in (500, 503):
                return None
            if resp.status_code != 200:
                print(f"Fetch SMS failed with status: {resp.status_code}")
                return []
            data = resp.json()
            return data.get('aaData', [])
        except Exception as e:
            print(f"Fetch error: {e}")
            return []

    async def run(self, bot_app):
        await self._login()
        consecutive_errors = 0
        while self.running:
            try:
                rows = await asyncio.to_thread(self._fetch_sms)
                if rows is None:
                    print("Session expired or server error, re-login...")
                    await self._login()
                    consecutive_errors = 0
                    continue
                if rows:
                    for row in reversed(rows):
                        if len(row) < 6 or str(row[2]) == "0":
                            continue
                        phone = str(row[2])
                        waktu = row[0]
                        service = row[3]
                        message = str(row[5]).replace('\n', ' ')
                        if Database.check_sms_history(phone, waktu):
                            continue
                        current_time = datetime.strptime(waktu, '%Y-%m-%d %H:%M:%S').replace(tzinfo=timezone.utc)
                        if self.last_sms_time is not None and current_time <= self.last_sms_time:
                            continue
                        self.last_sms_time = current_time
                        await self.process_sms(phone, message, service, bot_app)
                        print(f"\n{Fore.GREEN}☐ [ NEW SMS RECEIVED ]{Style.RESET_ALL}")
                        print(f"{Fore.CYAN}╰══ [] {phone} - {service}{Style.RESET_ALL}")
                    consecutive_errors = 0
                await asyncio.sleep(10)
            except Exception as e:
                consecutive_errors += 1
                print(f"Run error ({consecutive_errors}): {e}")
                await asyncio.sleep(min(30, 5 * consecutive_errors))
                if consecutive_errors >= 3:
                    print("Too many errors, re-login...")
                    await self._login()
                    consecutive_errors = 0

    async def process_sms(self, phone, message, service, bot_app):
        await self._send_broadcast(phone, message, service, bot_app)

    async def _send_broadcast(self, phone, message, service, bot_app):
        try:
            otp_code = Utils.extract_otp(message)
            if not isinstance(phone, str):
                phone = str(phone)
            country_info = Utils.get_country_by_code(phone)
            if country_info:
                short_name = country_info.get("shortName", "XX")
                custom_emoji_id = country_info.get("custom_emoji_id", "")
            else:
                short_name = "XX"
                custom_emoji_id = ""

            masked_phone = Utils.mask_phone(phone)
            groups = Database.load_groups()
            if groups:
                asyncio.create_task(self._send_to_groups(
                    groups, phone, message, service, otp_code,
                    short_name, custom_emoji_id, masked_phone, bot_app
                ))
        except Exception as e:
            print(f"Error in process_sms: {type(e).__name__}: {e}")

    async def _send_to_groups(self, groups, phone, message, service, otp_code, short_name, custom_emoji_id, masked_phone, bot_app):
        batch_size = 20
        for i in range(0, len(groups), batch_size):
            batch = groups[i:i+batch_size]
            tasks = []
            for group_id in batch:
                if not isinstance(group_id, str) or not group_id.strip():
                    continue
                tasks.append(self._send_to_single_group(
                    group_id, phone, message, service, otp_code,
                    short_name, custom_emoji_id, masked_phone, bot_app
                ))
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)
            await asyncio.sleep(0.2)

    async def _send_to_single_group(self, group_id, phone, message, service, otp_code, short_name, custom_emoji_id, masked_phone, bot_app):
        try:
            flag_id = custom_emoji_id or "5816769540066906278"
            service_emoji_id = Utils.get_service_emoji(service)
            roket_emoji = "5145427681680032825"
            number_emoji_id = "5413879192267805083"
            info_emoji_id = "6206508629286196237"

            sms_message = f"▫ #{short_name} ▫ +{masked_phone} ▫\n\n©𝘽𝙮 𝙏𝙚𝙖𝙢 𝙓𝙣𝙚𝙩𝟰𝟬𝟯 𝙊𝙛𝙛𝙞𝙘𝙞𝙖𝙡"

            def utf16_len(text):
                return len(text.encode("utf-16-le")) // 2

            positions = []
            idx = 0
            while True:
                pos = sms_message.find("▫", idx)
                if pos == -1:
                    break
                positions.append(pos)
                idx = pos + 1

            entities = []
            if len(positions) >= 3:
                p1, p2, p3 = positions[0], positions[1], positions[2]
                entities.append(MessageEntity(
                    type="custom_emoji",
                    offset=utf16_len(sms_message[:p1]),
                    length=1,
                    custom_emoji_id=str(flag_id)
                ))
                entities.append(MessageEntity(
                    type="custom_emoji",
                    offset=utf16_len(sms_message[:p2]),
                    length=1,
                    custom_emoji_id=str(service_emoji_id)
                ))
                entities.append(MessageEntity(
                    type="custom_emoji",
                    offset=utf16_len(sms_message[:p3]),
                    length=1,
                    custom_emoji_id=str(roket_emoji)
                ))
                entities.append(MessageEntity(
                    type="bold",
                    offset=utf16_len(sms_message[:p1+2]),
                    length=1 + len(short_name)
                ))
                entities.append(MessageEntity(
                    type="bold",
                    offset=utf16_len(sms_message[:p2+2]),
                    length=len("+" + masked_phone)
                ))

            keyboard = []
            copy_text = str(message) if message else " "

            if otp_code and otp_code != "N/A":
                keyboard.append([
                    InlineKeyboardButton(
                        text=f"{otp_code}",
                        copy_text=CopyTextButton(text=copy_text),
                        api_kwargs={
                            "icon_custom_emoji_id": "6206112371308500200",
                            "style": "success"
                        }
                    )
                ])
            else:
                keyboard.append([
                    InlineKeyboardButton(
                        text=" 𝙼𝙴𝚂𝚂𝙰𝙶𝙴",
                        copy_text=CopyTextButton(text=copy_text),
                        api_kwargs={
                            "icon_custom_emoji_id": "6206112371308500200",
                            "style": "success"
                        }
                    )
                ])

            row = []
            if self.config.NUMBER_BOT:
                row.append(
                    InlineKeyboardButton(
                        text=" 𝙽𝚄𝙼𝙱𝙴𝚁𝚂",
                        url=self.config.NUMBER_BOT,
                        api_kwargs={
                            "icon_custom_emoji_id": number_emoji_id,
                            "style": "primary"
                        }
                    )
                )
            if self.config.CH_INFO:
                row.append(
                    InlineKeyboardButton(
                        text=" 𝙸𝙽𝙵𝙾",
                        url=self.config.CH_INFO,
                        api_kwargs={
                            "icon_custom_emoji_id": info_emoji_id,
                            "style": "primary"
                        }
                    )
                )
            if row:
                keyboard.append(row)

            sent_message = await send_with_retry(
                bot_app.bot.send_message,
                chat_id=int(group_id.strip()),
                text=sms_message,
                entities=entities,
                reply_markup=InlineKeyboardMarkup(keyboard) if keyboard else None,
                link_preview_options=LinkPreviewOptions(is_disabled=True)
            )

            Database.add_bot_message(group_id.strip(), sent_message.message_id)

        except Exception as e:
            print(f"Error sending to group {group_id}: {e}")

    async def stop(self):
        self.running = False
        if self.session:
            self.session.close()


class BotHandler:
    def __init__(self, config: Config):
        self.config = config
        self.otp_fetcher = OTPFetcher(config)

    async def addbot_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        chat = update.effective_chat
        if chat.type not in ['group', 'supergroup']:
            await update.message.reply_text(
                "╭ ❌ 𝙏𝙝𝙞𝙨 𝙘𝙤𝙢𝙢𝙖𝙣𝙙 𝙘𝙖𝙣 𝙤𝙣𝙡𝙮 𝙗𝙚 𝙪𝙨𝙚𝙙 𝙞𝙣 𝙜𝙧𝙤𝙪𝙥𝙨 \n╰ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ╯",
                parse_mode=ParseMode.HTML
            )
            return
        group_id = str(chat.id)
        if Database.add_group(group_id):
            message_text = "╭ 𝙂𝙧𝙤𝙪𝙥 𝙨𝙪𝙘𝙘𝙚𝙨𝙨𝙛𝙪𝙡𝙡𝙮 𝙖𝙙𝙙𝙚𝙙 \n╰ ━━━━━━━━━━━━━━━━━ ╯"
            await update.message.reply_text(message_text, parse_mode=ParseMode.HTML)
            print(f"Group added via /addbot: {group_id} ({chat.title})")
        else:
            await update.message.reply_text(
                f"╭ 𝙂𝙧𝙤𝙪𝙥 𝙝𝙖𝙨 𝙗𝙚𝙚𝙣 𝙖𝙙𝙙𝙚𝙙 \n╰ ━━━━━━━━━━━━━━━ ╯",
                parse_mode=ParseMode.HTML
            )

    async def auto_delete_old_messages(self, context: ContextTypes.DEFAULT_TYPE):
        minutes = 15
        old_messages = Database.get_old_bot_messages(minutes)
        for msg in old_messages:
            try:
                await context.bot.delete_message(
                    chat_id=msg["group_id"],
                    message_id=msg["message_id"]
                )
            except:
                pass
            Database.remove_bot_message(msg["group_id"], msg["message_id"])


def main():
    Database.init_db()
    config = Config()
    bot_handler = BotHandler(config)

    application = Application.builder().token(config.BOT_TOKEN).build()
    application.add_handler(CommandHandler("addbot", bot_handler.addbot_command))

    if application.job_queue:
        application.job_queue.run_repeating(
            bot_handler.auto_delete_old_messages,
            interval=60,
            first=10
        )

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    async def run():
        await application.initialize()
        await application.start()
        await application.updater.start_polling()
        fetcher_task = asyncio.create_task(bot_handler.otp_fetcher.run(application))
        try:
            await fetcher_task
        except asyncio.CancelledError:
            pass
        finally:
            await bot_handler.otp_fetcher.stop()

    try:
        loop.run_until_complete(run())
        loop.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        loop.run_until_complete(application.stop())
        loop.close()

if __name__ == "__main__":
    main()