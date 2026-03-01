import { Injectable } from '@angular/core';
import { Entity, EntityField } from '../models/entity.model';
import { EntityRecord } from '../models/entity-record.model';

export type TemplateType = 'project-tracker' | 'crm' | 'product-ideation';

export interface Template {
    id: TemplateType;
    name: string;
    description: string;
    entities: Entity[];
    records: EntityRecord[];
}

@Injectable({ providedIn: 'root' })
export class TemplateService {
    getTemplate(templateId: TemplateType): Template {
        switch (templateId) {
            case 'project-tracker':
                return this.getProjectTrackerTemplate();
            case 'crm':
                return this.getCrmTemplate();
            case 'product-ideation':
                return this.getProductIdeationTemplate();
            default:
                return this.getProjectTrackerTemplate();
        }
    }

    getAvailableTemplates(): Array<{ id: TemplateType; name: string; description: string }> {
        return [
            { id: 'project-tracker', name: 'Project Tracker', description: 'Manage projects, tasks, and team members' },
            { id: 'crm', name: 'CRM', description: 'Track accounts, leads, and opportunities' },
            { id: 'product-ideation', name: 'Product Ideation', description: 'Organize problems, personas, users, and projects' }
        ];
    }

    private getProjectTrackerTemplate(): Template {
        const entities: Entity[] = [
            {
                id: '1772310521347-y5myyhl0j',
                name: 'Team Member',
                pluralName: 'Team Members',
                fields: [
                    { id: '1772310529665-ksz8ea0sr', name: 'Name', type: 'short-text' },
                    { id: '1772310532882-g3us1fumg', name: 'Title', type: 'short-text' },
                    { id: '1772310556063-7fmtd2u2w', name: 'Team', type: 'reference', referenceEntityId: '1772310544848-wq6e553q3' }
                ],
                displayNameFieldId: '1772310529665-ksz8ea0sr'
            },
            {
                id: '1772310544848-wq6e553q3',
                name: 'Team',
                pluralName: 'Teams',
                fields: [{ id: '1772310614114-4xwtklm66', name: 'Name', type: 'short-text' }]
            },
            {
                id: '1772310624109-pk7op268b',
                name: 'Project',
                pluralName: 'Projects',
                fields: [
                    { id: '1772310628695-557i0oaa3', name: 'Name', type: 'short-text' },
                    { id: '1772310649225-umgk8przz', name: 'Problem Statement', type: 'long-text' },
                    { id: '1772310676690-7nyjo5foq', name: 'Statement of Work', type: 'long-text' },
                    { id: '1772310687667-3c24aocrb', name: 'Team', type: 'reference', referenceEntityId: '1772310544848-wq6e553q3' },
                    { id: '1772310706021-lhsg7gf8c', name: 'Time Estimate (working days)', type: 'number' }
                ],
                displayNameFieldId: '1772310628695-557i0oaa3'
            },
            {
                id: '1772310728856-iqg7d9an4',
                name: 'Task',
                pluralName: 'Tasks',
                fields: [
                    { id: '1772310736904-87mgwxh0e', name: 'Name', type: 'short-text' },
                    { id: '1772310793220-tx3usihxv', name: 'Assignee', type: 'reference', referenceEntityId: '1772310521347-y5myyhl0j' },
                    { id: '1772311999999-assignees01', name: 'Assignees', type: 'reference-list', referenceEntityId: '1772310521347-y5myyhl0j' },
                    { id: '1772310812805-wbhza1et1', name: 'AC', type: 'long-text' },
                    { id: '1772310819672-at1za4rik', name: 'Implementation Notes', type: 'long-text' }
                ],
                displayNameFieldId: '1772310736904-87mgwxh0e'
            }
        ];

        const records: EntityRecord[] = []; // Empty for simplicity - keep current mock data in mock-data.ts
        return { id: 'project-tracker', name: 'Project Tracker', description: 'Manage projects and tasks', entities, records };
    }

    private getCrmTemplate(): Template {
        const entities: Entity[] = [
            {
                id: 'crm-account-1',
                name: 'Account',
                pluralName: 'Accounts',
                fields: [
                    { id: 'crm-account-name', name: 'Name', type: 'short-text' },
                    { id: 'crm-account-description', name: 'Description', type: 'long-text' },
                    { id: 'crm-account-website', name: 'Website', type: 'short-text' },
                    { id: 'crm-account-notes', name: 'Notes', type: 'long-text' }
                ],
                displayNameFieldId: 'crm-account-name'
            },
            {
                id: 'crm-lead-1',
                name: 'Lead',
                pluralName: 'Leads',
                fields: [
                    { id: 'crm-lead-name', name: 'Name', type: 'short-text' },
                    { id: 'crm-lead-email', name: 'Email', type: 'short-text' },
                    { id: 'crm-lead-phone', name: 'Phone', type: 'short-text' },
                    { id: 'crm-lead-account', name: 'Account', type: 'reference', referenceEntityId: 'crm-account-1' },
                    { id: 'crm-lead-status', name: 'Status', type: 'option', optionValues: ['New', 'Contacted', 'Qualified', 'Lost'] }
                ],
                displayNameFieldId: 'crm-lead-name'
            },
            {
                id: 'crm-opportunity-1',
                name: 'Opportunity',
                pluralName: 'Opportunities',
                fields: [
                    { id: 'crm-opportunity-name', name: 'Name', type: 'short-text' },
                    { id: 'crm-opportunity-account', name: 'Account', type: 'reference', referenceEntityId: 'crm-account-1' },
                    { id: 'crm-opportunity-amount', name: 'Amount', type: 'number' },
                    { id: 'crm-opportunity-stage', name: 'Stage', type: 'option', optionValues: ['Prospect', 'Negotiation', 'Closed Won', 'Closed Lost'] },
                    { id: 'crm-opportunity-notes', name: 'Notes', type: 'long-text' }
                ],
                displayNameFieldId: 'crm-opportunity-name'
            },
            {
                id: 'crm-interaction-1',
                name: 'Interaction',
                pluralName: 'Interactions',
                fields: [
                    { id: 'crm-interaction-name', name: 'Name', type: 'short-text' },
                    { id: 'crm-interaction-lead', name: 'Lead', type: 'reference', referenceEntityId: 'crm-lead-1' },
                    { id: 'crm-interaction-date', name: 'Date', type: 'short-text' },
                    { id: 'crm-interaction-notes', name: 'Notes', type: 'long-text' }
                ],
                displayNameFieldId: 'crm-interaction-name'
            }
        ];

        const records: EntityRecord[] = [];
        return { id: 'crm', name: 'CRM', description: 'Track sales pipeline', entities, records };
    }

    private getProductIdeationTemplate(): Template {
        const entities: Entity[] = [
            {
                id: 'pi-persona-1',
                name: 'User Persona',
                pluralName: 'User Personas',
                fields: [
                    { id: 'pi-persona-name', name: 'Name', type: 'short-text' },
                    { id: 'pi-persona-characteristics', name: 'Characteristics', type: 'long-text' },
                    { id: 'pi-persona-goals', name: 'Goals', type: 'long-text' }
                ],
                displayNameFieldId: 'pi-persona-name'
            },
            {
                id: 'pi-problem-1',
                name: 'Problem',
                pluralName: 'Problems',
                fields: [
                    { id: 'pi-problem-name', name: 'Name', type: 'short-text' },
                    { id: 'pi-problem-description', name: 'Description', type: 'long-text' },
                    { id: 'pi-problem-personas', name: 'User Personas', type: 'reference-list', referenceEntityId: 'pi-persona-1' }
                ],
                displayNameFieldId: 'pi-problem-name'
            },
            {
                id: 'pi-project-1',
                name: 'Project',
                pluralName: 'Projects',
                fields: [
                    { id: 'pi-project-name', name: 'Name', type: 'short-text' },
                    { id: 'pi-project-problem', name: 'Problem', type: 'reference', referenceEntityId: 'pi-problem-1' },
                    { id: 'pi-project-description', name: 'Description', type: 'long-text' },
                    { id: 'pi-project-tam', name: 'TAM', type: 'short-text' },
                    { id: 'pi-project-impact', name: 'Impact', type: 'number' },
                    { id: 'pi-project-effort', name: 'Effort', type: 'number' },
                    { id: 'pi-project-desire', name: 'Desire', type: 'number' }
                ],
                displayNameFieldId: 'pi-project-name'
            }
        ];

        const records: EntityRecord[] = [];
        return { id: 'product-ideation', name: 'Product Ideation', description: 'Organize product ideas', entities, records };
    }
}
