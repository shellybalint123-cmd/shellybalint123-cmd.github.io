# אתר שלי בלינט

אתר תדמית אישי — HTML/CSS/JS פשוט, בלי build tools. מתפרסם ישירות ל-GitHub Pages.

## איך להחליף תמונות בגלריה
כרגע התאים ב"תיק עבודות" הם placeholder-ים צבעוניים (ב-`index.html`, בתוך `.gallery-grid`).
כדי להחליף אותם בתמונות אמיתיות:

1. שימי את קבצי התמונות בתיקייה `assets/gallery/`.
2. בכל `<div class="gallery-item">` — החליפי את התוכן ב-`<img src="assets/gallery/שם-הקובץ.jpg" alt="תיאור העבודה">`.

## איך להריץ מקומית
פשוט לפתוח את `index.html` בדפדפן, או להריץ שרת סטטי מקומי (למשל `npx serve .`).

## איך לפרסם עדכונים
```
git add .
git commit -m "עדכון תוכן"
git push
```
GitHub Pages יתעדכן אוטומטית תוך דקה-שתיים.
