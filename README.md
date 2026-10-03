# cs3398-team05-project

## Documentation

- [Database Schema](docs/schema.md)
- [Tagging System](docs/tags.md)
- [API Overview](docs/api.md)
- [Intro and Running Project Locally](docs/intro.md)

## Running Project
To run project, fist make sure you have npm installed.

**Installing NPM** 

If running on windows, install npm by pasting the following command in the terminal. Its best practice to reset your terminal so that environmental variables update
```
winget install -e --id OpenJS.NodeJS.LTS
```
On a machine running linux and using the apt package manager run the command below. Again, it is best practice to reset your terminal so that the environmental variables update.
```
sudo apt update && sudo apt install -y nodejs npm
```

**Running Project**

Now just navigate to the repo in the terminal and run the following:
```bash
npm install
npm run dev
```
