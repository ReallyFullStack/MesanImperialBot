# Imperial Bot

This bot is used on the Discord server of Mesa on the [Insert Name SMP](https://insmp.miraheze.org/wiki/INSMP).
It is used to display laws, send fancy messages, display the constitution, register and manage companies, announce new laws in the gazette, ...

## Get Started

First, you'll need to clone the repository and install the dependencies:

```sh
git clone https://github.com/ReallyFullStack/MesanImperialBot
cd MesanImperialBot
npm install
```

It has for dependencies `discord.js`, `better-sqlite3`, `@googleapis/docs` and `dotenv`.

Then, you will have to create an SQLite3 database at `data/database.db` based on the `data/database.sql` schema:

```sh
sqlite3 data/database.db < data/database.sql
```

Finally, you will have to rename `src/RENAME.env` to `.env` and populate it with:

```toml
TOKEN="BOT_TOKEN_HERE"                                             # Bot token from the Discord Dev Portal
CLIENT_ID="BOT_CLIENTID_HERE"                                      # Client ID from the Discord Dev Portal
DEFAULT_GUILD_ID="DEFAULTGUID_ID_HERE"                             # Guild ID of the bot's main Discord server
OWNER_ID="YOUR_USERID_HERE"                                        # Your Discord User ID
PREFIX="!"                                                         # Prefix for message commands
GOOGLE_APPLICATION_CREDENTIALS="../data/googleapicredentials.json" # Path to your Google Service Account key file
GOOGLE_SERVICEACCOUNT_EMAIL="SERVICEACCOUNT_EMAIL_HERE"            # Your Google Service Account's e-mail address
```

You will have to register both an application on the Discord Dev Portal, and an application in the Google Cloud Console, add it
the Google Docs API, create a Service Account and download the key file for the Service Account. For the bot to access Google Docs
documents, you have to or make the document available to everyone with the link, or share it with the bot's Service Account e-mail.

## License

This project is licensed under the GNU Affero General Public License, version 3 or later, see [`LICENSE`](./LICENSE) for more information.
