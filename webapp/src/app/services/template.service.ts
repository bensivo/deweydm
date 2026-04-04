import { Injectable } from '@angular/core';
import { Entity, EntityField } from '../models/entity.model';
import { EntityRecord } from '../models/entity-record.model';
import { List } from '../models/list.model';

export type TemplateType = 'project-tracker' | 'crm' | 'product-ideation';

export interface Template {
    id: TemplateType;
    name: string;
    description: string;
    entities: Entity[];
    records: EntityRecord[];
    lists: List[];
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
                    { id: '1772310793220-asdfaisda', name: 'Project', type: 'reference', referenceEntityId: '1772310624109-pk7op268b' },
                    { id: '1772310812805-wbhza1et1', name: 'AC', type: 'long-text' },
                    { id: '1772310819672-at1za4rik', name: 'Implementation Notes', type: 'long-text' }
                ],
                displayNameFieldId: '1772310736904-87mgwxh0e'
            }
        ];

        const records: EntityRecord[] = [
            // Teams
            { id: '1772310900001-team1', entityId: '1772310544848-wq6e553q3', data: { '1772310614114-4xwtklm66': 'Engineering Team' } },
            // Team Members
            { id: '1772310901001-member1', entityId: '1772310521347-y5myyhl0j', data: { '1772310529665-ksz8ea0sr': 'Alice Johnson', '1772310532882-g3us1fumg': 'Senior Engineer', '1772310556063-7fmtd2u2w': '1772310900001-team1' } },
            { id: '1772310901002-member2', entityId: '1772310521347-y5myyhl0j', data: { '1772310529665-ksz8ea0sr': 'Bob Smith', '1772310532882-g3us1fumg': 'Tech Lead', '1772310556063-7fmtd2u2w': '1772310900001-team1' } },
            // Projects
            { id: '1772310902001-project1', entityId: '1772310624109-pk7op268b', data: { '1772310628695-557i0oaa3': 'Website Redesign', '1772310649225-umgk8przz': 'Modernize the company website with a fresh design', '1772310676690-7nyjo5foq': 'Complete redesign and modernization', '1772310687667-3c24aocrb': '1772310900001-team1', '1772310706021-lhsg7gf8c': '20' } },
            { id: '1772310902002-project2', entityId: '1772310624109-pk7op268b', data: { '1772310628695-557i0oaa3': 'Mobile App Development', '1772310649225-umgk8przz': 'Build native iOS and Android apps', '1772310676690-7nyjo5foq': 'Create cross-platform mobile experience', '1772310687667-3c24aocrb': '1772310900001-team1', '1772310706021-lhsg7gf8c': '35' } },
            { id: '1772310902003-project3', entityId: '1772310624109-pk7op268b', data: { '1772310628695-557i0oaa3': 'Database Optimization', '1772310649225-umgk8przz': 'Improve query performance and indexing', '1772310676690-7nyjo5foq': 'Optimize database for scale', '1772310687667-3c24aocrb': '1772310900001-team1', '1772310706021-lhsg7gf8c': '8' } },
            { id: '1772310902004-project4', entityId: '1772310624109-pk7op268b', data: { '1772310628695-557i0oaa3': 'API Documentation', '1772310649225-umgk8przz': 'Complete API reference and guides', '1772310676690-7nyjo5foq': 'Create comprehensive API documentation', '1772310687667-3c24aocrb': '1772310900001-team1', '1772310706021-lhsg7gf8c': '5' } },
            // Tasks
            { id: '1772310903001-task1', entityId: '1772310728856-iqg7d9an4', data: { '1772310793220-asdfaisda':'1772310902001-project1', '1772310736904-87mgwxh0e': 'Design mockups', '1772310793220-tx3usihxv': '1772310901001-member1', '1772310812805-wbhza1et1': 'Create wireframes and high-fidelity mockups', '1772310819672-at1za4rik': 'Use Figma for design' } },
            { id: '1772310903002-task2', entityId: '1772310728856-iqg7d9an4', data: { '1772310793220-asdfaisda':'1772310902001-project1', '1772310736904-87mgwxh0e': 'Implement frontend components', '1772310793220-tx3usihxv': '1772310901002-member2', '1772310812805-wbhza1et1': 'Build React components from mockups', '1772310819672-at1za4rik': 'Follow the design system' } },
            { id: '1772310903003-task3', entityId: '1772310728856-iqg7d9an4', data: { '1772310793220-asdfaisda':'1772310902001-project1', '1772310736904-87mgwxh0e': 'Setup development environment', '1772310793220-tx3usihxv': '1772310901002-member2', '1772310812805-wbhza1et1': 'Configure local dev environment and deployment', '1772310819672-at1za4rik': 'Document setup process' } },
            { id: '1772310903004-task4', entityId: '1772310728856-iqg7d9an4', data: { '1772310793220-asdfaisda':'1772310902001-project1', '1772310736904-87mgwxh0e': 'Create database schema', '1772310793220-tx3usihxv': '1772310901001-member1', '1772310812805-wbhza1et1': 'Design and implement database tables', '1772310819672-at1za4rik': 'Use PostgreSQL' } },
            { id: '1772310903005-task5', entityId: '1772310728856-iqg7d9an4', data: { '1772310793220-asdfaisda':'1772310902001-project1', '1772310736904-87mgwxh0e': 'API endpoint development', '1772310793220-tx3usihxv': '1772310901002-member2', '1772310812805-wbhza1et1': 'Build REST API endpoints for core features', '1772310819672-at1za4rik': 'Follow API design guidelines' } },
            { id: '1772310903006-task6', entityId: '1772310728856-iqg7d9an4', data: { '1772310793220-asdfaisda':'1772310902001-project1', '1772310736904-87mgwxh0e': 'Write unit tests', '1772310793220-tx3usihxv': '1772310901001-member1', '1772310812805-wbhza1et1': 'Achieve 80%+ code coverage', '1772310819672-at1za4rik': 'Use Jest for testing' } },
            { id: '1772310903007-task7', entityId: '1772310728856-iqg7d9an4', data: { '1772310793220-asdfaisda':'1772310902001-project1', '1772310736904-87mgwxh0e': 'Performance optimization', '1772310793220-tx3usihxv': '1772310901002-member2', '1772310812805-wbhza1et1': 'Optimize images, bundle size, and API responses', '1772310819672-at1za4rik': 'Target < 3s initial load' } },
            { id: '1772310903008-task8', entityId: '1772310728856-iqg7d9an4', data: { '1772310793220-asdfaisda':'1772310902001-project1', '1772310736904-87mgwxh0e': 'Security audit', '1772310793220-tx3usihxv': '1772310901001-member1', '1772310812805-wbhza1et1': 'Review and fix security vulnerabilities', '1772310819672-at1za4rik': 'Check OWASP top 10' } },
            { id: '1772310903009-task9', entityId: '1772310728856-iqg7d9an4', data: { '1772310793220-asdfaisda':'1772310902001-project1', '1772310736904-87mgwxh0e': 'User acceptance testing', '1772310793220-tx3usihxv': '1772310901002-member2', '1772310812805-wbhza1et1': 'Conduct UAT with stakeholders', '1772310819672-at1za4rik': 'Document feedback and iterations' } },
            { id: '1772310903010-task10', entityId: '1772310728856-iqg7d9an4', data: { '1772310793220-asdfaisda':'1772310902001-project1', '1772310736904-87mgwxh0e': 'Deployment and launch', '1772310793220-tx3usihxv': '1772310901001-member1', '1772310812805-wbhza1et1': 'Deploy to production and monitor', '1772310819672-at1za4rik': 'Have rollback plan ready' } }
        ];
        const lists: List[] = [
            { id: '1772310000001-projectbacklog', name: 'Project Backlog', itemIds: [] },
            { id: '1772310000002-taskbacklog', name: 'Task Backlog', itemIds: [] }
        ];
        return { id: 'project-tracker', name: 'Project Tracker', description: 'Manage projects and tasks', entities, records, lists };
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

        const records: EntityRecord[] = [
            // Accounts
            { id: 'crm-rec-001-acme', entityId: 'crm-account-1', data: { 'crm-account-name': 'Acme Corporation', 'crm-account-description': 'Leading enterprise software provider', 'crm-account-website': 'www.acme.com', 'crm-account-notes': 'Key account - Fortune 500 company' } },
            { id: 'crm-rec-002-techstart', entityId: 'crm-account-1', data: { 'crm-account-name': 'TechStart Inc', 'crm-account-description': 'Fast-growing SaaS startup', 'crm-account-website': 'www.techstart.io', 'crm-account-notes': 'Series B funding round' } },
            // Leads
            { id: 'crm-rec-003-john', entityId: 'crm-lead-1', data: { 'crm-lead-name': 'John Doe', 'crm-lead-email': 'john@acme.com', 'crm-lead-phone': '555-0100', 'crm-lead-account': 'crm-rec-001-acme', 'crm-lead-status': 'Qualified' } },
            { id: 'crm-rec-004-jane', entityId: 'crm-lead-1', data: { 'crm-lead-name': 'Jane Smith', 'crm-lead-email': 'jane@techstart.io', 'crm-lead-phone': '555-0101', 'crm-lead-account': 'crm-rec-002-techstart', 'crm-lead-status': 'Contacted' } },
            // Opportunities
            { id: 'crm-rec-005-opp1', entityId: 'crm-opportunity-1', data: { 'crm-opportunity-name': 'Enterprise License - Acme', 'crm-opportunity-account': 'crm-rec-001-acme', 'crm-opportunity-amount': '150000', 'crm-opportunity-stage': 'Negotiation', 'crm-opportunity-notes': 'Multi-year contract discussion' } },
            { id: 'crm-rec-006-opp2', entityId: 'crm-opportunity-1', data: { 'crm-opportunity-name': 'Startup Package - TechStart', 'crm-opportunity-account': 'crm-rec-002-techstart', 'crm-opportunity-amount': '45000', 'crm-opportunity-stage': 'Prospect', 'crm-opportunity-notes': 'Initial qualification phase' } },
            // Interactions
            { id: 'crm-rec-007-int1', entityId: 'crm-interaction-1', data: { 'crm-interaction-name': 'Discovery Call', 'crm-interaction-lead': 'crm-rec-003-john', 'crm-interaction-date': '2026-03-10', 'crm-interaction-notes': 'Discussed requirements and timeline' } },
            { id: 'crm-rec-008-int2', entityId: 'crm-interaction-1', data: { 'crm-interaction-name': 'Demo Session', 'crm-interaction-lead': 'crm-rec-004-jane', 'crm-interaction-date': '2026-03-12', 'crm-interaction-notes': 'Demonstrated core features, very positive feedback' } },
            { id: 'crm-rec-009-int3', entityId: 'crm-interaction-1', data: { 'crm-interaction-name': 'Budget Discussion', 'crm-interaction-lead': 'crm-rec-003-john', 'crm-interaction-date': '2026-03-14', 'crm-interaction-notes': 'Reviewed pricing and contract terms' } },
            { id: 'crm-rec-010-int4', entityId: 'crm-interaction-1', data: { 'crm-interaction-name': 'Technical Review', 'crm-interaction-lead': 'crm-rec-004-jane', 'crm-interaction-date': '2026-03-15', 'crm-interaction-notes': 'IT team reviewed integration requirements' } },
            { id: 'crm-rec-011-int5', entityId: 'crm-interaction-1', data: { 'crm-interaction-name': 'Follow-up Call', 'crm-interaction-lead': 'crm-rec-003-john', 'crm-interaction-date': '2026-03-17', 'crm-interaction-notes': 'Answered additional questions, moving to negotiation' } },
            { id: 'crm-rec-012-int6', entityId: 'crm-interaction-1', data: { 'crm-interaction-name': 'Executive Alignment', 'crm-interaction-lead': 'crm-rec-004-jane', 'crm-interaction-date': '2026-03-18', 'crm-interaction-notes': 'Presented to C-suite, approved to proceed' } },
            { id: 'crm-rec-013-int7', entityId: 'crm-interaction-1', data: { 'crm-interaction-name': 'Contract Negotiation', 'crm-interaction-lead': 'crm-rec-003-john', 'crm-interaction-date': '2026-03-19', 'crm-interaction-notes': 'Final contract terms agreed upon' } },
            { id: 'crm-rec-014-int8', entityId: 'crm-interaction-1', data: { 'crm-interaction-name': 'Implementation Planning', 'crm-interaction-lead': 'crm-rec-004-jane', 'crm-interaction-date': '2026-03-20', 'crm-interaction-notes': 'Discussed implementation timeline and resource requirements' } },
            { id: 'crm-rec-015-int9', entityId: 'crm-interaction-1', data: { 'crm-interaction-name': 'Onboarding Training', 'crm-interaction-lead': 'crm-rec-003-john', 'crm-interaction-date': '2026-03-21', 'crm-interaction-notes': 'Delivered product training to customer team' } },
            { id: 'crm-rec-016-int10', entityId: 'crm-interaction-1', data: { 'crm-interaction-name': 'Go-live Support', 'crm-interaction-lead': 'crm-rec-004-jane', 'crm-interaction-date': '2026-03-22', 'crm-interaction-notes': 'Provided support during go-live, all systems operational' } }
        ];
        const lists: List[] = [
            { id: 'crm-0000001-newopportunities', name: 'New Opportunities', itemIds: [] }
        ];
        return { id: 'crm', name: 'CRM', description: 'Track sales pipeline', entities, records, lists };
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

        const records: EntityRecord[] = [
            // User Personas
            { id: 'pi-rec-001-pm', entityId: 'pi-persona-1', data: { 'pi-persona-name': 'Product Manager Sarah', 'pi-persona-characteristics': 'Data-driven, organized, experienced with agile', 'pi-persona-goals': 'Ship features faster, reduce deployment friction, improve team communication' } },
            { id: 'pi-rec-002-dev', entityId: 'pi-persona-1', data: { 'pi-persona-name': 'Developer Alex', 'pi-persona-characteristics': 'Technical, focused, values automation', 'pi-persona-goals': 'Streamline deployment process, reduce manual work, improve reliability' } },
            // Problems
            { id: 'pi-rec-003-problem1', entityId: 'pi-problem-1', data: { 'pi-problem-name': 'Slow and error-prone deployment process', 'pi-problem-description': 'Teams spend hours on manual deployments with high failure rates and limited visibility', 'pi-problem-personas': 'pi-rec-001-pm,pi-rec-002-dev' } },
            { id: 'pi-rec-003-problem2', entityId: 'pi-problem-1', data: { 'pi-problem-name': 'Lack of visibility into system health', 'pi-problem-description': 'No centralized monitoring or alerting leads to slow incident response', 'pi-problem-personas': 'pi-rec-002-dev' } },
            { id: 'pi-rec-003-problem3', entityId: 'pi-problem-1', data: { 'pi-problem-name': 'Difficulty scaling infrastructure', 'pi-problem-description': 'Manual scaling processes cause downtime and inefficient resource usage', 'pi-problem-personas': 'pi-rec-001-pm,pi-rec-002-dev' } },
            { id: 'pi-rec-003-problem4', entityId: 'pi-problem-1', data: { 'pi-problem-name': 'Complex debugging and logging', 'pi-problem-description': 'Developers struggle to debug issues due to scattered logs and lack of correlation', 'pi-problem-personas': 'pi-rec-002-dev' } },
            // Projects
            { id: 'pi-rec-004-project1', entityId: 'pi-project-1', data: { 'pi-project-name': 'Automated Deployment Pipeline', 'pi-project-problem': 'pi-rec-003-problem1', 'pi-project-description': 'Build an automated deployment system that reduces manual work and improves reliability', 'pi-project-tam': '$2B enterprise market', 'pi-project-impact': '9', 'pi-project-effort': '7', 'pi-project-desire': '8' } },
            { id: 'pi-rec-004-project2', entityId: 'pi-project-1', data: { 'pi-project-name': 'Comprehensive Monitoring Platform', 'pi-project-problem': 'pi-rec-003-problem2', 'pi-project-description': 'Create integrated monitoring, alerting, and dashboarding platform', 'pi-project-tam': '$3.5B DevOps market', 'pi-project-impact': '8', 'pi-project-effort': '8', 'pi-project-desire': '9' } },
            { id: 'pi-rec-004-project3', entityId: 'pi-project-1', data: { 'pi-project-name': 'Auto-scaling Infrastructure Manager', 'pi-project-problem': 'pi-rec-003-problem3', 'pi-project-description': 'Intelligent auto-scaling based on demand and cost optimization', 'pi-project-tam': '$1.5B infrastructure market', 'pi-project-impact': '7', 'pi-project-effort': '6', 'pi-project-desire': '7' } },
            { id: 'pi-rec-004-project4', entityId: 'pi-project-1', data: { 'pi-project-name': 'Unified Logging and Tracing System', 'pi-project-problem': 'pi-rec-003-problem4', 'pi-project-description': 'Centralized logging with distributed tracing and intelligent analysis', 'pi-project-tam': '$2.5B observability market', 'pi-project-impact': '8', 'pi-project-effort': '7', 'pi-project-desire': '8' } }
        ];
        const lists: List[] = [
            { id: 'pi-0000001-projectroadmap', name: 'Project Roadmap', itemIds: [] }
        ];
        return { id: 'product-ideation', name: 'Product Ideation', description: 'Organize product ideas', entities, records, lists };
    }
}
