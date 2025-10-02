# EnFlex.IT Template
## How to use
To setup a recommended project structure, simply run `scripts/create-enflex.it-app.sh`.
The script is going to ask you for the name of the folder that the project will be created in, as well as the upstream-url of the new project.
In most cases this is going to be something like: `https://github.com/{user}/{repo}.git` or `git@github.com:{user}/{repo}.git`.

### Requirements
The Script assumes git on your path.
Further the script is best run with a freshly created upstream-repo.

### Outcome
After running this script, one should have two branches
- `template`
- `master`

with each of them having a remote added to them
- `template`
- `origin`

where `template` points to the branch `master` of the `web.template` project and `origin` points to the branch `master` of project whose url was provided to the script.

This way, one can `git pull` the template branch to get current changes of the core library, and then merge with their own `master` branch.
