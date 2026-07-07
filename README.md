# אתר SBMEDIA - שלי באלינט

אתר תדמית אישי — HTML/CSS/JS פשוט, בלי build tools. מתפרסם ישירות ל-GitHub Pages.

## איך להוסיף את סרטוני הפורטפוליו
בסקשן "תיק עבודות" יש 6 כרטיסי וידאו מוכנים מראש (ב-`index.html`, בתוך `.video-grid`).
כל כרטיס כבר מוגדר עם `<video>` שמצפה לקובץ בשם קבוע בתיקייה `assets/videos/`:

- `assets/videos/car-planet.mp4`
- `assets/videos/goya.mp4`
- `assets/videos/platinum.mp4`
- `assets/videos/beauty.mp4`
- `assets/videos/wedding.mp4`
- `assets/videos/creative.mp4`

פשוט שימי קובץ MP4 בשם המתאים בתיקייה הזו — האתר יעבוד מיד, בלי לגעת בקוד.
עד שהקובץ לא קיים, הכרטיס מציג placeholder זהוב-כחול אלגנטי עם כפתור play.

## איך להריץ מקומית
פשוט לפתוח את `index.html` בדפדפן, או להריץ שרת סטטי מקומי (למשל `npx serve .`).

## איך לפרסם עדכונים
```
git add .
git commit -m "עדכון תוכן"
git push
```
GitHub Pages יתעדכן אוטומטית תוך דקה-שתיים.
