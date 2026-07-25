//app/scripts/register-commands.js

import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

const commands = [
  {
    name: "movie",
    description: "Search for a movie",
    options: [
      {
        name: "query",
        description: "Movie title",
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: "tv",
    description: "Search for a TV show",
    options: [
      {
        name: "query",
        description: "TV show title",
        type: 3,
        required: true,
      },
    ],
  },
];

const res = await fetch(
  `https://discord.com/api/v10/applications/${process.env.DISCORD_APPLICATION_ID}/commands`,
  {
    method: "PUT",
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  },
);
console.log(process.env.DISCORD_APPLICATION_ID);
console.log(process.env.DISCORD_BOT_TOKEN);
console.log(await res.json());
