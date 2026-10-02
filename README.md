# Imperial Bot

This bot was meant to be used on the Discord server of Mesa on the [Insert Name SMP](https://insmp.miraheze.org/wiki/INSMP).
However, it won't but I continue making it personally. For people from Mesa, don't consider any of the information in this repo binding,
it's just for my personal, individual and independent larp, not an actual stance on New Mesa or an act of secession or whatever.
It is used to display laws, send fancy messages, display the constitution, register and manage companies, announce new laws in the gazette, ...

## Get Started

First, you'll need to clone the repository and install the dependencies:

```sh
git clone https://github.com/ReallyFullStack/MesanImperialBot
cd MesanImperialBot
npm install
```

It has for major dependencies `discord.js`, `better-sqlite3`, `@googleapis/docs`, `@googleapis/drive` and `dotenv`.

Then, you will have to create an SQLite3 database at `data/database.db` based on the `data/database.sql` schema:

```sh
sqlite3 data/database.db < data/database.sql
```

You will have to register both an application on the Discord Dev Portal, and an application in the Google Cloud Console, add it
the Google Docs API and Google Drive API, create a Service Account and download the key file for the Service Account. For the bot to access Google Docs
documents, you have to or make the document available to everyone with the link, or share it with the bot's Service Account e-mail.

Finally, you will have to rename [`src/RENAME.env`](./src/RENAME.env) to `.env` and populate it with the required information.

### Run

-   To run the dev environment, use:

    ```sh
    npm run dev
    ```

-   To run the production environment:

    ```sh
    npm run prod
    ```

## License

This project is licensed under the GNU Affero General Public License, version 3 or later, see [`LICENSE`](./LICENSE) for more information.
