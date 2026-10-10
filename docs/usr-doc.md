# User guide

Dashboard lets you build your own start page out of **widgets**: small panels that show live information such as the weather in your city, the latest articles of a news feed, your GitHub repositories or your next Google Calendar events. This guide explains how to use it. No technical knowledge is needed.

## Contents

1. [Create your account](#1-create-your-account)
2. [Log in and out](#2-log-in-and-out)
3. [Your dashboard](#3-your-dashboard)
4. [Add a widget](#4-add-a-widget)
5. [Available widgets](#5-available-widgets)
6. [Move, resize, edit and remove widgets](#6-move-resize-edit-and-remove-widgets)
7. [Connected accounts (GitHub and Google)](#7-connected-accounts-github-and-google)
8. [Delete your account](#8-delete-your-account)
9. [Troubleshooting](#9-troubleshooting)

## 1. Create your account

You need an account before you can see the dashboard. There are two ways to get one.

### With GitHub or Google

On the **Log in** or **Create account** page, click **Continue with GitHub** or **Continue with Google**, then accept on the GitHub or Google page. You come back logged in. There is no email to confirm, since GitHub or Google has already checked your address.

If you already have an account with the same email address, you are logged in to that account.

### With an email and a password

1. Click **Create account** at the top right.
2. Enter your email address and a password of **at least 8 characters**.
3. Click **Create account**. A "Check your email" message appears.
4. Open the email we sent you and click the confirmation link. It is valid for **24 hours**.
5. A page tells you that your account is confirmed. Click **Log in**.

**No email?** Check your spam folder. If it is still missing, ask the person running the application: they can confirm your account for you.

**The link expired?** Simply create an account again with the same email address. You will get a new confirmation email, and the new password replaces the old one.

## 2. Log in and out

- **Log in:** enter your email and password, or click **Continue with GitHub / Google** if that is how you created your account. You can only log in with a password once your email is confirmed.
- **Stay logged in:** you remain logged in on this browser until you log out (or for up to 7 days).
- **Log out:** click the circle with your initials at the top right, then **Log out**.

If you are not logged in, opening the dashboard sends you to the login page first.

## 3. Your dashboard

The dashboard is the main page. It shows your widgets in a grid that fills the whole width of the screen, and adapts to your device: up to 5 columns on a large screen, down to a single column on a phone.

Each widget has:

| Element | What it does |
| --- | --- |
| Colored line on top | The service's color: blue for weather, orange for RSS, black for GitHub, Google's colors for Google |
| **⠿** (left of the title) | Handle to drag the widget to another position |
| Logo and title | The service and widget name, for example `weather · city_temperature` |
| **⚙** | Change the widget's settings |
| **✕** | Remove the widget |
| Corner at the bottom right | Drag it to make the widget bigger or smaller |
| Footer | How often the widget refreshes, for example "refreshes every 300s" |

On a computer, **⚙**, **✕** and the resize corner appear when you move the mouse over the widget.

Your changes are **saved automatically to your account**: widgets, their order and their size. You will find the same dashboard if you log in from another browser or computer, and other accounts never see your widgets.

## 4. Add a widget

1. Click **+ Add widget** at the top right of the dashboard (or the large **+** area when your dashboard is empty).
2. Choose a **Service**, then a **Widget**. A short description appears under the choice.
3. Fill in the widget's settings (they depend on the widget, see [below](#5-available-widgets)). All settings are required: if one is missing or wrong, a red message tells you what to fix and the widget is not added.
4. Set the **Refresh rate**: how many seconds between updates. The default is 300 (5 minutes), the minimum is 10 and the maximum 86400 (one day).
5. Click **Add to dashboard**.

You can add the same widget several times with different settings, for example the weather in two different cities.

GitHub and Google widgets need your account on that service. If it is not connected yet, the dialog tells you, and the widget shows a **Connect** button once added (see [Connected accounts](#7-connected-accounts-github-and-google)).

## 5. Available widgets

### Weather

All weather widgets have one setting:

| Setting | Example |
| --- | --- |
| City | `Strasbourg` |

| Widget | What it shows |
| --- | --- |
| `city_temperature` | The temperature, the city and country, and the precipitation. |
| `city_weather_summary` | The current temperature and conditions, today's minimum and maximum, the chance of rain, the precipitation and the wind. |
| `city_weather_detailed` | The current conditions (feels like, humidity, rain, wind), the next 24 hours, and the forecast for the next 7 days. Best displayed in a large widget. |

### RSS: `article_list`

Shows the latest articles of a news feed. Click an article to open it in a new tab.

| Setting | Description | Example |
| --- | --- | --- |
| Feed URL | Address of an RSS feed | `https://hnrss.org/frontpage` |
| Number of articles | From 1 to 50 (default 5) | `5` |

Other feeds you can try: `https://feeds.bbci.co.uk/news/rss.xml`, `https://www.lemonde.fr/rss/une.xml`.

The feed must be a public address on the internet. For security, addresses inside the server's own network (such as `localhost`, `127.0.0.1` or `192.168.…`) are refused, even through a redirect.

### GitHub (needs your GitHub account)

| Widget | Setting | What it shows |
| --- | --- | --- |
| `repositories` | Number of repositories, 1 to 30 (default 5) | Your most recently updated repositories: name, Public or Private, description, language, stars and when it was last updated. Click a repository to open it on GitHub. |
| `notifications` | Number of notifications, 1 to 50 (default 10) | Your unread GitHub notifications: the repository, the title of the pull request, issue or release, why you got it, and when. Click one to open it on GitHub. |

### Google (needs your Google account)

| Widget | Setting | What it shows |
| --- | --- | --- |
| `calendar_events` | Number of events, 1 to 25 (default 5) | The next events of your main Google Calendar, grouped by day like in Google Calendar, with their time and place. Today is circled in blue, and all-day events are shown in a blue box. Click an event to open it in Google Calendar. |

## 6. Move, resize, edit and remove widgets

- **Move:** press and hold the **⠿** handle, drag the widget to its new place, and release.
- **Resize:** drag the corner at the bottom right of the widget. A widget can be up to 5 columns wide (fewer on smaller screens) and 8 rows tall. On a phone, widgets are always full width and their height follows their content.
- **Edit:** click **⚙**. You can change the settings and the refresh rate. The service and widget type cannot be changed: to switch to another widget, remove this one and add a new one.
- **Remove:** click **✕**. The widget disappears immediately.

## 7. Connected accounts (GitHub and Google)

To show your GitHub or Google data, the dashboard needs your permission to read it. It only asks for what its widgets use: your profile and email, your GitHub notifications, and read-only access to your Google Calendar. It never asks for permission to change anything.

**Connect an account**, in either of these ways:

- In a GitHub or Google widget, click **Connect GitHub** / **Connect Google**.
- Click the circle with your initials at the top right, then **Connected accounts**, then **Connect** next to the service.

Accept on the GitHub or Google page, and you come back to where you were. If you signed in with GitHub or Google, that account is already connected.

**Disconnect an account:** in **Connected accounts**, click **Disconnect**. Its widgets then show **Connect** again. You cannot disconnect the only way you have to log in (an account created with GitHub, for example, cannot disconnect GitHub).

The connected account also lets you log in with **Continue with GitHub / Google**.

## 8. Delete your account

Click the circle with your initials at the top right, then **Delete account**, and confirm. Your account, your dashboard and your connected accounts are deleted immediately and for good. This cannot be undone.

## 9. Troubleshooting

| Problem | What to do |
| --- | --- |
| "This email already exists" | This email belongs to a confirmed account. Log in instead. |
| "Please confirm your email before logging in" | Open the confirmation link from your email. If it has expired, create the account again with the same email. |
| "Could not send the confirmation email" | The application could not send the email. Try again later, use **Continue with GitHub / Google**, or contact whoever runs the application. |
| "Verification failed" when opening the link | The link expired or was already used. Create the account again with the same email to get a new one. |
| "Invalid email or password" | Check for typos. Passwords are case-sensitive. |
| "This account uses GitHub or Google sign-in" | You created this account with GitHub or Google: use **Continue with GitHub / Google** instead of a password. |
| "You cancelled the authorization." | You clicked Cancel on the GitHub or Google page. Try again and accept. |
| "That account is already connected to another dashboard user." | This GitHub or Google account is linked to a different dashboard account. Log in to that account, or disconnect it there first. |
| A widget shows **Connect GitHub** / **Connect Google** | The account is not connected, or its access has expired. Click the button and accept again. |
| A widget shows an error | Check its settings with **⚙**: is the city spelled correctly, is the feed URL a valid RSS feed? Some websites do not allow their feed to be read by other applications; try another feed. |
| "This URL is not allowed" | The feed URL points to a private or local address, or redirects to one. Use the public address of the feed. |
| "Could not reach the server" | The application's server is not running or not reachable. Try again in a moment, or contact whoever runs it. |
| You were sent back to the login page | Your session expired. Log in again: your widgets are still there. |
| "Could not save your changes" | Your connection to the server was interrupted. Check your connection, then make the change again. |

## Your data

The application stores your email address, the list of widgets you configured (with their settings, position and size), and, if you created one, your password. The password is never stored as-is: only a scrambled (hashed) version is kept, so nobody, including administrators, can read it.

If you connect GitHub or Google, the application also stores the permission GitHub or Google gave it, **encrypted**, so your widgets can read your data. Disconnecting the account or deleting your Dashboard account removes it. You can also revoke it at any time from your GitHub or Google account settings.
