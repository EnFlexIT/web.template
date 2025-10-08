#usr/bin/sh

# First we add a new origin that points to the template repo
git remote add template git@github.com:EnFlexIT/web.template.git
# We then fetch all information related to the new origin
git fetch template
# Lastly, we create a new branch off the template/master origin
git branch template template/master

