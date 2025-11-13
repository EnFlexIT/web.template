# web.template

## Table of Contents
- [About](#About)
- [Motivation](#Motivation)
- [Working with this Repository](#Working-with-this-Repository)
  - [Requirements](#Requirements-Template)
  - [Setting up](#Setup-Template)
- [Creating a new EnFlex.IT Project which is based on this template](#Creating-a-new-EnFlex.IT-Project-which-is-based-on-this-template)
  - [Requirements](#Requirements-Project)
  - [Setting up](#Setup-Project)
  - [Workflow](#Intended-Workflow)
  - [Build and Deployment](#BuildingAndDeploying)
    - [Manually](#BuildingAndDeployingManually)
    - [Automatically](#BuildingAndDeployingAutomatically)
- [Project Structure](#Project-Structure)
- [Styling](#styling)
    - [History](#stylingHistory)
    - [How to style](#HowToStyle)
    - [How to include new values into the theme](#ExpandingTheTheme)
    - [How themeing is implemented](#HowItIsActuallyImplemented)
    - [unistyles vs legacy](#UnistylesVSLegacy)
- [Api](#api)
- [Data Management](#redux)

## <a id="About">About</a>

Its codebase acts as a template for succeeding EnFlex.IT applications and already implements features such as:
- Theming
- Authentication with an Agent.Workbench via jwt and openidconnect
- Dynamic content
- Dynamic menues

## <a id="Motivation">Motivation</a>

At some point while developing, we wanted to split our code into different packages.
We tried so for some time and came to the conclusion that packaging our code and especially maintaining those packages comes with its own kind of challenges and is really time consuming too.
We felt that the extra effort was not worth the gain and so we ended up moving all the code back into one repo again.
Still, we wanted to reuse what code we already have across multiple projects.
So we arrived at the following solution:
This repository is the basis for all EnFlex.IT applications.
If you wish to create a new EnFlex.IT application, you need to do so by instantiating this template.
This new project must then have a 'template' branch whose origin points to this repository.
By doing so, you can pull any changes related to this repository into your local 'template' branch and then merge these changes with your local 'master' branch.
In the end, all of the framework code lives in this repository and all of the project specific code lives in its specific repository and we do not package any code.

## <a id="Working-with-this-Repository">Working with this Repository</a>

In its current state, this repository is not just a template you can use to create new projects but also a standalone project that can be developed and run.
this section explains how to setup and run this specific respository locally.

### <a id="Requirements-Template">Requirements</a>

In Order to download, initialize and run the code, you need the following software:
- git
- npm
- node.js (tested and working with lts Jod)

Git hardly needs any explanation I would assume. Get it [here](https://git-scm.com/downloads).
Both npm and Node.js come bundled together. Node.js is the runtime environment for javascript outside of the browser and npm is javascript's dedicated package manager.
You could compare Node.js with the jre and npm with maven.
Get both executables by following the official instructions [here](https://nodejs.org/en/download).

After you have successfully installed the software above and set it up in such a way that you can work with it (e.g. setting the $PATH environment variable) we can continue to set up this repository locally.

### <a id="Setup-Template">Setting up</a>

First `git clone` this Repository to any desired location on your computer. I will refer to this location by $ROOT.

Next, open up a Terminal and navigate to $ROOT. This is usually done with `cd $ROOT`.
Once $ROOT is your working directory, we need to install all of the project's dependencies. This can be done with `npm install`.
We now have all of the code and its dependencies installed locally.

Finally, start the 'compiler' with `npx expo`.

You should now see the interface of the metro bundler. this is the piece of software that takes all of our code and bundles it. Further, it serves this bundled code on a local webbrowser.
So we can e.g. visit http://localhost:8080 (this is the default url where metro serves our code and could differ in your case. consult the metro interface if you suspect a different url) and metro should start compiling our code.
Once its done, the webpage gets rendered and you can start developing.
If you make any changes to the codebase, metro should pick up on that, recompile everything and hot reload the webpage.

## <a id="Creating-a-new-EnFlex.IT-Project-which-is-based-on-this-template">Creating a new EnFlex.IT Project that is based on this template</a>

this section describes how to create a new project $MY_PROJECT that is based on this template, set up your environment so you can develop $MY_PROJECT locally and configure the intended workflow to keep $MY_PROJECT up to date with this template.

### <a id="Requirements-Project">Requirements</a>

Any new project you want to be able to run inherently needs to be able to run the code present in this template.
Therefore, check [here](#Requirements-Template) for the requirements of the template and come back once you are done.

After you have successfully met all requirements descibed by the template, we can start to create a new project that is based on this template.

### <a id="Setup-Project">Setting up</a>

First, you want to click on the green "Use this template" button in the upper right corner of the Github interface to create a new github repository that is based on this template.

After you have hit "Create repository", it should take only a few seconds and then you are greeted with a new repository.
This new repository already includes all of the files this repository has plus its remote `origin` was set to the url of the new repository.

Next - as your new project is merely a clone of the template at this point - follow all of the steps described [here](#Setup-Template) to finish the setup and come back once you are done.

You should now be able to run the code and visit the webpage.

The only thing that is missing now is to set up the [intended workflow](#Intended-Workflow) and then you can start developing.

## <a id="Intended-Workflow">Intended Workflow</a>

Wether you have just created a new project that is based on this template or you have pulled an exisiting project that is based on this template, to now be able to sync this template with your project, please run `scripts/init.sh`.
This little helper script does two things:
- It adds a new origin `template` to your project that is pointing to this template
- It creates a new branch whose upstream is the newly created `template` origin.

Now, If there is a change to this template, first pull your local `template` branch to include the newest changes and then merge `template` with your `master` branch.
this way your project is always up to date with this template, but all of the framework code lives in this repo and all of the project specific code lives in the project specific repository.

## <a id="BuildingAndDeploying">Building and Deployment</a>

If you wish to build and deploy your app, after you have sucessfully instantiated a new project and made development, you have two choices:
- Either build and deploy manually
- Or do it automatically via a provided script

### <a id="BuildingAndDeployingManually">Manually</a>
If you wish to build and deploy your project in a manual way such that you have full control, you can run the following command: `npx expo export -p web`.
This command packages all of your source code with the metro bundler and outputs an `index.html` alongside all of the assets inside of `/dist`.
You can now serve the app via e.g. nginx.

Note that this only works for web. If you wish to deploy the app to any mobile device you need to do your own research as we have not done this as of writing this document.

### <a id="BuildingAndDeployingAutomatically">Automatically</a>
If you wish to build and deploy your app automatically such that it integrates with e.g. agent.workbench, we have provided the github action `Export Put Release` under `.github/workflows/export-put-release.yml`.
To be able to use this action, simply do as follows:
- Go to Repository Settings > Secrets and Variables > Actions > Repository secrets > New Repository Secret and add the following secrets:
  - FTP_UPLOAD_URL - the url of the ftp server that is used to upload the build artifact
  - FTP_USER - the ftp user for the server
  - FTP_PWSD - the password of the user
  - PROJECT_NAME - the name that is used to bundle the build artifact. `$PROJECT_NAME.zip`
  - PROJECT_PATH - the relative path from the root of the ftp server where the `.zip` will be put. Be aware that the directories must already be available.
- After sucessfully setting all required secrets, go to: Actions > Export Put Release > Run Workflow and run the workflow.
  This will build the project and upload the build artifact to the ftp server.

Any `.zip` build artifact that is exported this way follows this naming convention: $name_$version_$timeAndDate where the name is equal to the repository secret, the version number is equal to the version number that is specified in `package.json` and the timeAndDate are equal to the time and date of the build server. 

## <a id="Project-Structure">Project Structure</a>

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
- `src/stylistic` & `src/themed` - has components that are automatically styled according to the theme. See [styling](#styling) for more information
- `src/hooks` - any custom react hook
- `src/redux` - all code that belongs to the redux library.
- `src/screens` - this folder stores all React Components that are used as screens. Screens are those components that make up the entirety of the screen.


## <a id="Styling">Styling</a>
This section discusses how to change the project-wide styling information to modify the look of the entire application - so called themes - as well as how to style individual elements.
You should be familiar with the principles of React, namely what components are and how they play a key-role in programming with react to understand this section.
If you are not up to speed, you can read up on components [here](https://react.dev/learn/your-first-component).

### <a id="stylingHistory">History</a>
Originally, we used a really simple setup for styling:
We had a `<ThemeProvider />`, which was just a `<Context.Provider />`, sit at the top of the DOM hierarchy.
Its value would be the result of a `useState` function call.
If anybody down the hierarchy now wanted to update the theme, they would get the `setTheme` function via `useContext` and call it to rerender the whole application.
Any StyleSheet `stylesF` that was defined, was actually a function of type `Theme -> StyleSheet`, such that inside of a component you could first accquire the Theme and then call `const styles = stylesF(theme);` to therefore make StyleSheets dependent on Themes.

This approached worked wonderfully but had two minor downsides: If you wanted to use any style inside of a component, you always had to first call `useTheme` to retrieve the theme and then call `stylesF(theme)` to actually construct the StyleSheet.
We later introduced `useThematicallyDependentStyle(stylesF)` which reduced the boilerplate to a single function call.\
Secondely, if you had any conditional styles, they would not be nice to implement. You would need a state variable to track the boolean and then use a ternary operator in conjunction with two `on` and `off` styles to implement the desired "conditional" style.
Namely the fact that you had to introduce two styles to implement one conditional style quickly made StyleSheet declarations unreadable and cluttered.
E.g. say we want to implement a button which should change its textcolor and backgroundcolor on hover. Further we want it to have padding and a bigger fontsize regardless of the state in which its in.
For this to work, we now need the following styles: `[container, containerHover, containerNotHover, text, textHover, textNotHover]`.
It is easy to see that any non-trivial component suffers from this approach.

To fix the issues stated above, we introduced and have ever since been successfully working with unistyles as our styling solution.

See [this](#UnistylesVSLegacy) section to how the unistyles approach compares to the legacy approach.

### <a id="HowToStyle">How to style</a>
The styling information of this application is split into two categories.

First we have all styling that impacts how something looks.
That could be textcolor, backgroundcolor, cardcolor, fontsize, fontFamily, etc...

Secondely we have all styling that impacts where something is located.
e.g. padding, margin, flexDirection, align-properties.

The first category is defined and can be changed at the theme-level.
This means that any of the properties previously mentioned are defined on a per-theme basis in the `DarkTheme` and `LightTheme` objects.
See `src/styles/*theme.tsx`.

The second category is defined on a per-component basis.
This means that if you'd like to change e.g. the margin between items inside of the header, you would have to look into `src/components/Header.tsx`

There may be inconsistency of course but this is how we tried to do it across the application.

Further, we use the library `unistyles` for styling.
Refer to [their Documentation](https://www.unistyl.es/) to see whats possible.

### <a id="ExpandingTheTheme">How to include new values into the theme</a>
It may happen that our theme type does not capture some project wide styling property that would be great to have.

e.g. Background Color specifically for the Sidebar.

To expand the themes by these properties, simply add the properties to the javascript object and the type dynamically gets updated.

e.g. to include the previously mentioned backgroundcolor, one could add:
```ts
// src/styles/darkTheme.tsx
import { fonts } from "./fonts";

export const darkTheme = {
    dark: true,
    colors: {
        // ...
        backgroundColorForSidebar: 'darkblue',
    },
    // ....
} as const

import { fonts } from "./fonts";

export const lightTheme = {
    dark: false,
    colors: {
      // ..
      backgroundColorForSidebar: 'red' // <-- Important that the properties have the same name. Otherwise the automatic type deduction does not work
    },
    // ....
} as const
```

### <a id="HowItIsActuallyImplemented">How it is actually implemented</a>

To answer the question of how this styling information is actually processed and used at a project wide scope, you just have to look at `src/components/themed/*` and `src/components/stylistic/*`.

Components inside of the `themed` folder implement the theme-based colors.
They use a StyleSheet that depends on unistyle's theme to get their respective fontColor, backgroundColor, etc.
If unistyle's theme ever changes, the components detect this change and adjust their colors, which in turn adjusts the project wide look.

Components inside of the `stylistic` folder build upon the themed components and implement all the other information. e.g. fontSize, fontFamily.

Thus, we have a collection of "prestyled" (stylistic) components e.g. `<H1 />`, `<H2 />`, `<StylisticTextInput />` that match their appearance to the current theme at all times and all use the same underlying basic components.

### <a id="UnistylesVSLegacy">Unistyles vs Legacy</a>

With unistyles there is almost no difference in syntax when it comes to defining styles.
The Legacy and unistyles approach define styles like so:
```ts
const stylesF = createThematicallyDependentStyle((theme) => ({
  // ...
}))

const styles = StyleSheet.create((theme) => ({
  // ...
}))
```

The two big advantages of unistyles over the legacy approach (at least for me) were:

- You can access defined styles directly (with `styles.class`), instead of always having to first call `const styles = useThematicallyDependentStyles(stylesF)`
- You can more easily define variants of styles. See the unistyles documentation for that.

Besides those changes, we also removed the provider (as it was no longer necessary) and instead include `unistyles.ts` inside of `index.tsx` which then calls `StyleSheet.configure`

### <a id="api"> Working with the Agent.Workbench API </a>
A fundamental task of developing a project for the web group is to work with the api that Agent.Workbench provides.

All OpenAPI specification can be found [here](https://github.com/EnFlexIT/RestAPIs).
For actually working with the api, this project and any project derived from this include a git submodule under `src/api/definiton` that is linked to the actual api specifications.
Further, this project includes the [@openapitools/openapi-generator-cli](https://www.npmjs.com/package/@openapitools/openapi-generator-cli) dependency which allows us to generate code from an openapi specification.

So the usual workflow would go something like this:
- An Api is specified inside of [RestAPIs Repo](https://github.com/EnFlexIT/RestAPIs)
- You pull the api by updating the git submodule inside of your respective project
- You use `openapi-generator-cli` to generate an implementation of the api.

This way, the need to write boilerplate to interface with apis is eliminated and the generated boilerplate 100% fullfills our agreement (assuming the generator is correctly implemented)

`package.json` already provided two scripts: `AWB-RestAPI` and `AWB-RestAPI` which build their respective api as well as `api` which just calls the two scripts consecutevly.
