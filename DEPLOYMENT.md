# انتشار badaneziba.com با GitHub و Cloudflare Workers

این پروژه HTML/CSS/JS است و به بک‌اند، بانک اطلاعاتی یا GitHub Pages نیاز ندارد. GitHub مخزن سورس است و Workers Static Assets فایل‌ها را میزبانی می‌کند. درخواست فایل‌های استاتیک طبق تعرفه فعلی Cloudflare رایگان است؛ ثبت و تمدید دامنه جداگانه است و امکانات پویا یا بیلد تابع محدودیت‌های پلن هستند.

## آماده‌سازی خروجی

Node.js نسخه ۲۰ یا جدیدتر:

```powershell
npm run build
```

خروجی در `dist` قرار می‌گیرد. فقط فایل‌های لازم و رسانه‌های استفاده‌شده کپی می‌شوند؛ تصاویر اولیه، اسکریپت‌های تولید ویدیو و پیش‌نمایش‌ها منتشر نمی‌شوند. پوشه dist باید صرفاً خروجی همین پروژه باشد. هیچ وابستگی npm برای ساخت خروجی لازم نیست.

## اتصال GitHub

۱. مخزن پروژه: https://github.com/mohammadali008/badaneziba-web — شاخه production را `main` انتخاب کنید. فایل‌های `package.json` و `wrangler.jsonc` باید در ریشه مخزن باشند.

۲. در Cloudflare، بخش Workers & Pages، یک Worker با اتصال به مخزن GitHub بسازید. نام Worker را `badaneziba-web` انتخاب کنید تا با فایل تنظیمات یکسان باشد.

۳. ریشه پروژه را `/`، فرمان build را `npm run build` و فرمان deploy را `npx wrangler deploy` بگذارید. در صورت درخواست نصب Wrangler، همان ابزار رسمی Cloudflare استفاده شود. اتصال GitHub در پنل، انتشار خودکار commitهای شاخه production را مدیریت می‌کند؛ نیازی به نوشتن توکن در سورس نیست.

۴. پس از بیلد موفق، نسخه workers.dev را بازبینی کنید. سپس در Settings → Domains & Routes، دامنه سفارشی `badaneziba.com` را اضافه کنید. دامنه باید به حساب Cloudflare اضافه شده و DNS آن فعال باشد. رکوردهای ایمیل موجود را هنگام انتقال DNS حفظ کنید.

۵. در صورت استفاده از `www.badaneziba.com`، برای آن redirect دائمی ۳۰۱ به `https://badaneziba.com` بسازید و مسیر و query را حفظ کنید. نشانی اصلی تمام متادیتاها نسخه بدون www است. HTTPS را در نسخه نهایی بررسی کنید.

## پس از انتشار

- صفحه اصلی، تماس، واتساپ، ویدیو، صفحه ۴۰۴ و نمایش موبایل را روی دامنه واقعی امتحان کنید.
- در Google Search Console، دامنه را با رکورد DNS تأیید کنید و `https://badaneziba.com/sitemap.xml` را ثبت کنید.
- با URL Inspection، امکان crawl و canonical صفحه اصلی را بررسی و درخواست ایندکس کنید.
- داده BeautySalon را با Rich Results Test بررسی کنید. نمایش نتیجه ویژه یا رتبه مشخص تضمین‌شده نیست.
- محتوای FAQ برای خواننده است؛ گوگل از ژوئن ۲۰۲۶ نمایش FAQ rich results را متوقف کرده است، بنابراین برای این قابلیت FAQPage اضافه نشده است.
- نام، شماره، آدرس و ساعت فعالیت را در منابع عمومی مرتبط یکسان نگه دارید. از نظر یا امتیاز ساختگی استفاده نکنید.

فایل‌های دامنه و سورس مخزن آماده‌اند؛ اتصال Cloudflare، تغییر DNS و ثبت Search Console باید پس از اتصال حساب انجام شوند.

منابع رسمی: [تعرفه Workers](https://developers.cloudflare.com/workers/platform/pricing/)، [Static Assets](https://developers.cloudflare.com/workers/static-assets/)، [اتصال Git](https://developers.cloudflare.com/workers/ci-cd/builds/)، [سئوی کسب‌وکار محلی](https://developers.google.com/search/docs/appearance/structured-data/local-business)، [تغییرات مستندات گوگل](https://developers.google.com/search/updates).
