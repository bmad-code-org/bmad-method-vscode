export type ViewType = 'dashboard' | 'epics' | 'stories' | 'docs';

export interface ViewRoute {
  view: ViewType;
  params?: Record<string, string>;
}

export interface BreadcrumbItem {
  label: string;
  route: ViewRoute;
}
