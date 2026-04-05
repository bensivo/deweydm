# Dewey - Project Brief

## Background
The market of productivity tools for individuals and teams is vast, with each tool having its own niche and intended audience. To organize the market, we can define a few dimensions, then map existing services to these dimensions.

Dimensions:
- User granularity: individual, team 
- Structure: unstructured, structured, structured with customizability
- Function: project-management, sales, product-management, knowledge-management

Mapping some well-known tools onto these dimensions:
- Jira - A project-management solution for teams, offering customizability for teams that want it, or OOTB templates for those who don't.
- Confluence - A knowledge-management SaaS solution for teams doing engineering, not particularly structured. 
- Notion - A fully unstructued knowledge-management SaaS solution for individuals doing any kind of knowledge work
- Obsidian - Another unstructured knowledge-management solution for individuals doing any kind of knowledge work, but runs on the desktop, not as a SaaS solution.
- Salesforce - A very structured entity-management SaaS solution for teams doing sales

With this in mind, one pattern becomes increasingly clear, almost all tools designed for individuals are very unstructured. And almost all tools designed for larger teams and enterprises are either fully structured, or structured with customizability. 

The rationale for this is easy to understand - Enterprises require structure to make sure individuals on teams are working in repeatable ways. 
On the other hand, every individual is unique in their own personal workflows, so tools meant for individuals are better off building unstructured applications, then letting the individual impose structure in their mind if they want to. 

This is a gap, although individuals are all unique in their workflows, the need for structured knowledge managemetn is not lesser for individual knowledge workers. The prevalence of knoweldge-management frameworks like zettlekasten, second-brain, and others speaks to how much people feel the gap of structured information storage in individual knowledge-management tools. 


## Problem Statement
As an individual knowledge worker, if I want a structured knowledge-management solution, my only options are to procure an enterprise tool, or enforce structure using existing tools which were not designed with structure in mind.

In the first case, I likely have to sign up for a monthly membership, or live with a free-trial where I'm not a first-class customer. In the second case, I have to be rigorous and disciplined in my own note authoring, or risk turning my notes into a chaotic hellscape which is frustrating to use. 


## Goals
Create an application which allows an individual knowledge worker to organize their work in a structured ecosystem, no matter what that work is, or what workflows might be present. 

## Non Goals
We will not be targetting:
- Teams or enterprises - there are already tons of solutions in the market that fit this niche, and the technical requirements of customers in this sector are huge. 

- The note-taking ecosystem itself - this solution will be mostly for the organization of information, not its capture and authoring. AI and existing note-taking tools already fill this niche really well.

## Hypothesis
If we build an application that lets users easily define a structure for information, insert records into that structure, then build and run workflows, then we will remoev all thier cognitive load associated with the organization of information. 

As a result, our users will have more headspace to actually work on tasks. They will be more free, less stressed, and will be able to massively expand their scope of work without additional load. 

## Narratives
Alice is a recently-promoted technical lead on an engineering team. She excelled at delivering high-quality engineering work as a Senior IC, and thus was promoted. However, in her new role, she now has to manage 1:1's with all her engineers, manage a dozen projects in various states of planning and execution, and also keep track of all the people, processes, and vendors involved in each one. 

She first tries to organize all this information in a personal note-taking app like notion or obsdian, but quickly finds that it takes just as much effort to maintain the knoweldge-base as it gives her utility. Then she tries using a personal Jira board, but finds that Jira's project-management structure doesn't work for more vague information, like contact lists and vendors, where there isn't a specific workflow to follow. She plays with a set of organized excel sheets, but abandons it because excel's strict row-column format is limiting. 

Finally, she finds Dewey. She starts by defining a few structures for her needs: projects, teams, members, and documents. And immediately she finds that she can organize information however she needs. She can enter data into the system quickly, and can find any record with its associated context easily as well. 

As well, she can create basic workflows, map the entities onto it, and organize her work in a more systematic way - she no longer has to carefully consider the full context of a project to understand next steps, she just sees where it is in the workflow. 


