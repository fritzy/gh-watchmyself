# gh-watchmyself

Produces a summary of which of your modules you're watching and not, optionally watching them automatically for you.

I got tired of missing issues from my repos simply because I'd forgotten to watch it after I'd created it. I made this tool to audit and fix this problem.

## Install

`npm i -g gh-watchmyself`

## Usage

`gh-watchmyself [--admin] [--pull] [--push] [--owner] [--public] [--unforked] [--forked] [--watch] [--unwatch]`

`--admin`: include only repos with admin permission.

`--pull`: include only repos with pull permission.

`--push`: include only repos with push permission.

`--owner`: include only repos where you're the owner.

`--public`: include only public repos.

`--forked`: include only forked repos.

`--unforked`: include only unforked repos.

`--watch`: subscribe to any repos listed that aren't currently being watched.

`--unwatch`: subscribe to any repos listed that aren't currently being watched.

![Example usage](https://cldup.com/Stp_eqh72z.png)
