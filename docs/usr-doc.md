# User guide

Dashboard lets you build your own start page out of **widgets**: small panels that show live information such as the weather in your city or the latest articles of a news feed. This guide explains how to use it. No technical knowledge is needed.

## Contents

1. [Create your account](#1-create-your-account)
2. [Log in and out](#2-log-in-and-out)
3. [Your dashboard](#3-your-dashboard)
4. [Add a widget](#4-add-a-widget)
5. [Available widgets](#5-available-widgets)
6. [Move, edit and remove widgets](#6-move-edit-and-remove-widgets)
7. [Troubleshooting](#7-troubleshooting)

## 1. Create your account

You need an account before you can see the dashboard.

1. Click **Create account** at the top right.
2. Enter your email address and a password of **at least 8 characters**.
3. Click **Create account**. A "Check your email" message appears.
4. Open the email we sent you and click the confirmation link. It is valid for **24 hours**.
5. A page tells you that your account is confirmed. Click **Log in**.

> [!NOTE]
> In the development version of the application, confirmation emails are sent to a test mailbox instead of a real inbox. If you do not receive anything, ask the person running the application for the link. They can find it in the server logs (see the [Developer guide](DEVELOPER_GUIDE.md#email-confirmation-in-development)).

**The link expired?** Simply create an account again with the same email address. You will get a new confirmation email, and the new password replaces the old one.

## 2. Log in and out

- **Log in:** enter your email and password. You can only log in once your email is confirmed.
- **Stay logged in:** you remain logged in on this browser until you log out (or for up to 7 days).
- **Log out:** click the circle with your initials at the top right, then **Log out**.

If you are not logged in, opening the dashboard sends you to the login page first.

## 3. Your dashboard

The dashboard is the main page. It shows your widgets in a grid. Each widget has:

| Element | What it does |
| --- | --- |
| **⠿** (left of the title) | Handle to drag the widget to another position |
| Title | The service and widget name, for example `weather · city_temperature` |
| **⚙** | Change the widget's settings |
| **✕** | Remove the widget |
| Footer | How often the widget refreshes, for example "refreshes every 300s" |

Your changes are **saved automatically to your account**. You will find the same widgets if you log in from another browser or computer, and other accounts never see your widgets.

## 4. Add a widget

1. Click **+ Add widget** at the top right of the dashboard.
2. Choose a **Service**, then a **Widget**. A short description appears under the choice.
3. Fill in the widget's settings (they depend on the widget, see [below](#5-available-widgets)).
4. Set the **Refresh rate**: how many seconds between updates. The default is 300 (5 minutes) and the minimum is 10.
5. Click **Add to dashboard**.

You can add the same widget several times with different settings, for example the weather in two different cities.

## 5. Available widgets

### Weather: `city_temperature`

Shows the temperature, the city and country, and the precipitation.

| Setting | Example |
| --- | --- |
| City | `Strasbourg` |

### RSS: `article_list`

Shows the latest articles of a news feed. Click an article title to open it in a new tab.

| Setting | Description | Example |
| --- | --- | --- |
| Feed URL | Address of an RSS feed | `https://hnrss.org/frontpage` |
| Number of articles | From 1 to 50 (default 5) | `5` |

Other feeds you can try: `https://feeds.bbci.co.uk/news/rss.xml`, `https://www.lemonde.fr/rss/une.xml`.

## 6. Move, edit and remove widgets

- **Move:** press and hold the **⠿** handle, drag the widget to its new place, and release.
- **Edit:** click **⚙**. You can change the settings and the refresh rate. The service and widget type cannot be changed: to switch to another widget, remove this one and add a new one.
- **Remove:** click **✕**. The widget disappears immediately.

## 7. Troubleshooting

| Problem | What to do |
| --- | --- |
| "This email already exists" | This email belongs to a confirmed account. Log in instead. |
| "Please confirm your email before logging in" | Open the confirmation link from your email. If it has expired, create the account again with the same email. |
| "Verification failed" when opening the link | The link expired or was already used. Create the account again with the same email to get a new one. |
| "Invalid email or password" | Check for typos. Passwords are case-sensitive. |
| A widget shows an error | Check its settings with **⚙**: is the city spelled correctly, is the feed URL a valid RSS feed? Some websites do not allow their feed to be read by other applications; try another feed. |
| "Could not reach the server" | The application's server is not running or not reachable. Try again in a moment, or contact whoever runs it. |
| You were sent back to the login page | Your session expired. Log in again: your widgets are still there. |
| "Could not save your changes" | Your connection to the server was interrupted. Check your connection, then make the change again. |

## Your data

Your password is never stored as-is: only a scrambled (hashed) version is kept, so nobody, including administrators, can read it. The application stores your email address, that scrambled password, and the list of widgets you configured.