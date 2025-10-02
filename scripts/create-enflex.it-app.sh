#usr/bin/sh

read -p "Enter Projectname: " name
read -p "Enter Projecturl: " url

git clone git@github.com:EnFlexIT/web.template.git $name
cd $name

# First we rename the master branch to template
git branch -m master template
# Next we change the destination for where to push the template branch
git remote set-url --add --push origin $url
# We then push the template branch into the remote repo
git push origin template
# Lastly we change the name of the origin to template-origin
git remote rename origin template-origin

# Next we create a new branch off the template branch
git checkout -b master template
# We introduce a new remote
git remote add origin $url
# Finally we push the newly created master branch to the newly created remote
git push -u origin master
