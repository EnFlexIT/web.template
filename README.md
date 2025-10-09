# web.template

## introduction

This repository is the result of a two year effort. It is meant as a template for any succeeding EnFlex.IT Application.

## setup

this section describes the process of creating a new project that is based on this template.

### dependencies

- node.js (tested and working with lts Jod)
- npm
- git

### creating a new project

By clicking on the green “Use this template” button in the upper right corner of the GitHub interface, you can create a new repository that is based on this repository.
This new repository already includes all of the files this repository has plus its remote `origin` was set to the url of the new repository.
Pull the new repository to any location on your computer and start a terminal in that location.
To then enable the intended [workflow](/web.Template/workflow), please run `scripts/init.sh`, which creates a new branch with the name 'template' whose origin points to this repository.
Finally, install all of the dependencies with `npm install`.

After that, you are all set up and ready to go.
In the future, if there is an update to this template repository, pull the changes to the 'template' branch which was created by 'scripts/init.sh' and then merge the changes with your master branch.

### testing the template

You can also view the template locally by first cloning the repository and then running `npm install` in the root directory of the project. If all dependencies are installed successfully, you can start the Expo development environment by running `npx expo` in your terminal. This will launch the project and allow you to run it on your device.

## workflow

At some point while developing, we wanted to split our code into different packages.
We tried so for some time and came to the conclusion that packaging our code and especially maintaining those packages comes with its own kind of challenges and is really time consuming too.
We felt that the extra effort was not worth the gain and so we ended up moving all the code back into one repo again.
Still, we want to reuse what code we already have, across multiple projects.
So we arrived at the following solution:
This repository is the basis for all EnFlex.IT applications.
If you wish to create a new EnFlex.IT application, you need to do so by instantiating this template.
This new project must then have a 'template' branch whose origin points to this repository.
By doing so, you can pull any changes related to this repository into your local 'template' branch and then merge these changes with your local 'master' branch.
In the end, all of the framework code lives in this repository and all of the project specific code lives in its specific repository and we do not package any code (god bless)

## Project Structure

```
.
├── assets
│   └── locales
│       ├── de
│       └── en
├── scripts
└── src
    ├── api
    │   ├── definition
    │   └── implementation
    │       ├── AWB-RestAPI
    │       │   └── docs
    │       └── Dynamic-Content-Api
    │           └── docs
    ├── components
    │   ├── dynamic
    │   │   ├── content
    │   │   └── editors
    │   ├── richtexteditor
    │   │   ├── icons
    │   │   └── ui
    │   ├── stylistic
    │   └── themed
    ├── hooks
    ├── redux
    │   └── slices
    ├── screens
    │   ├── dynamic-content
    │   └── settings
    └── util
```

- `assets` - this directory includes all non-code files that are still essential to the project
- `assets/locales` - stores translation-files that are used by i18n
- `scripts` - keeps all scripts that are used for one thing or another. e.g. setting up the 'template' branch on initial set up
- `src` - this dir has all of the code source files
- `src/api` - Includes both a submodule which stores all our openapi.yml files as well as automatically generated implementations of those openapi.yml files via `npm run api` with `openapi-generator-cli`
- `src/components` - stores all react native components
- `src/components/dynamic` - includes the components to render AbstractSiteContent and its related editor
- `src/richtexteditor` - includes all neccessary components to make the richtexteditor work.
- `src/stylistic` & `src/themed` - has components that are automatically styled according to the theme. See [styling]('google.com') for more information
- `src/hooks` - any custom react hook
- `src/redux` - all code that belongs to the redux library.
- `src/screens` - this folder stores all React Components that are used as screens. Screens are those components that make up the entirety of the screen.
