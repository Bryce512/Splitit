# Splitit

# GitHub Common Terminal Commands
Follow this guide to using common commands from command line to access GitHub.

## Clone a Repo:
> git clone https://github.com/username/repository.git

## Pushing to Branch:
1. Add all changes in the current  directory
2. Commit changes to Branch
3. Push changes to the branch
> git add . \
 > git commit -m "Your commit message" \
 > git push origin branch-name 


## Pulling from Branch:
> git pull origin branch-name

## Switching Branches:
> git checkout branch-name

## Resetting local changes:
WARNING: This will reset your changes to the most recent push on the branch!

Reset Everything
> git reset

Or to reset to an older commit
  * > git revert <commit 1> <commit 2>

Remove Untracked Files
  * > git clean -f

### Create New:
* branch:
  * Create New Branch
    * > git branch new-branch-name
  * Switch to new branch
    * > git checkout -b new-branch-name

* File:
  * > git add filename

### Other Commands
>  git log
  * Shows a log of all commits to the branch and allows you to view an older commit
  
> git log --oneline --graph --decorate
  * Shows commit log condensed and more organized

> git branch 
  * Shows all branches and highlights the branch youre on 

> git --version
  * Shows what version of GitHub you use
  
### Git Configurations

> git config --global user.name "Your Name" 
  * change your user name
> git config --global user.email "your_email@example.com" 
  * change your user email
> git config --list
  * see a list of your GitHub configurations

