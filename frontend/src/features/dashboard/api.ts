import {apiClient} from "@/shared/api";

// Beträge kommen als Strings (DRF DecimalField), z. B. "812.50"
export interface DashboardOverview {
    total_income: string;
    total_costs: string;
    total_surplus: string;
    expense_ratio_percentage: string;
}

export interface PersonStats {
    person_id: string;
    first_name: string;
    total_income: string;
    cost_share_amount: string;
    disposable_income: string;
}

export interface CostCategoryStats {
    category_id: string;
    name: string;
    color_code: string;
    total_amount: string;
    percentage_of_costs: string;
}

export interface IncomeCategoryStats {
    category_id: string;
    name: string;
    color_code: string;
    total_amount: string;
    percentage_of_income: string;
}

export interface DashboardStats {
    period: {month: number; year: number};
    overview: DashboardOverview;
    persons: PersonStats[];
    cost_categories: CostCategoryStats[];
    income_categories: IncomeCategoryStats[];
}

export async function getDashboardStats(month: number, year: number): Promise<DashboardStats> {
    const res = await apiClient.get<DashboardStats>("finances/calculation-dashboard/", {
        params: {month, year},
    });
    return res.data;
}