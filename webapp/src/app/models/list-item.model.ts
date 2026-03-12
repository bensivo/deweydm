/**
 * Represents an item in a list, similar to a story/issue in a backlog
 */
export interface ListItem {
    id: string;
    title: string;
    description?: string;
    priority?: 'high' | 'medium' | 'low';
    assignee?: string;
}
