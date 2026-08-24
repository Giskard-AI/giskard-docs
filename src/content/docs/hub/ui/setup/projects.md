---
title: "Setup projects"
description: "Create, manage, and organize projects through the user interface. Set up workspaces, configure access controls, and manage team collaboration."
sidebar:
  order: 2
---

In this section, we will walk you through how to setup projects using the Hub interface.

A project is the workspace that everything else in the Hub belongs to: your agents, knowledge bases, datasets, evaluations and scan results all live inside one. Most teams create a project per AI product or per environment, so that a test dataset built for one assistant is never mixed with another's, and so that access can be granted to one product team without exposing the rest.

## Create a project

First, click on the "Settings" icon on the left panel, this page allows you to manage your projects and users (if you have the proper access rights).

In the Projects tab, click on "Create project" button. A modal will appear where you can enter your project's name and description.

![Create project dialog with name and description fields](/_static/images/hub/create-project.png)

Once the project is created, you can access its dashboard by clicking on it in the list. Alternatively, use the dropdown menu in the upper left corner of the screen to select the project you want to work on.

## Switch between projects

The dropdown in the upper left corner lists the projects you have access to, and switching it changes the context of every page in the Hub: the agents, datasets, evaluations and scans you see always belong to the currently selected project. If a dataset or an agent you expect is missing, checking which project is selected is the first thing to verify.

## Control access to a project

Creating a project requires the Create permission on the Project entity, which an administrator grants in the Settings area. Beyond that, permissions can be scoped per project, so you can let everyone read a project while only a few people are allowed to edit its datasets. Both the global and the scoped model are covered in [Set access rights](/hub/ui/access-rights).


## Next steps

Now that you have created a project, you can start setting up your agents and knowledge bases.

- **Setup agents** - [Setup agents](/hub/ui/setup/agents)
- **Setup knowledge bases** - [Setup knowledge bases](/hub/ui/setup/knowledge-bases)
- **Manage users and groups** - [Manage users and groups](/hub/ui/access-rights)
