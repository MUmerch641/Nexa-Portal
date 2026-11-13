import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabasePublishableKey } from "./supabaseConfig";

const client = createClient(supabaseUrl, supabasePublishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const PROFILE_TABLES = new Set(["user_profiles"]);

/**
 * The portal has a flexible, module-oriented data model. Auth stays on the
 * official Supabase client; module data is sent to our authenticated API,
 * which stores it in app_records and is still protected by database RLS.
 */
class ModuleQuery {
  constructor(table) {
    this.table = table;
    this.operation = "select";
    this.values = null;
    this.filters = [];
    this.orderBy = null;
    this.maxRows = null;
    this.columns = "*";
    this.singleResult = false;
    this.maybeSingleResult = false;
  }

  select(columns = "*") {
    this.columns = columns;
    return this;
  }

  insert(values) { this.operation = "insert"; this.values = values; return this; }
  upsert(values) { this.operation = "upsert"; this.values = values; return this; }
  update(values) { this.operation = "update"; this.values = values; return this; }
  delete() { this.operation = "delete"; return this; }
  eq(column, value) { this.filters.push({ column, operator: "eq", value }); return this; }
  neq(column, value) { this.filters.push({ column, operator: "neq", value }); return this; }
  ilike(column, value) { this.filters.push({ column, operator: "ilike", value }); return this; }
  gte(column, value) { this.filters.push({ column, operator: "gte", value }); return this; }
  lte(column, value) { this.filters.push({ column, operator: "lte", value }); return this; }
  gt(column, value) { this.filters.push({ column, operator: "gt", value }); return this; }
  lt(column, value) { this.filters.push({ column, operator: "lt", value }); return this; }
  or(expression) { this.filters.push({ operator: "or", value: expression }); return this; }
  match(values = {}) {
    Object.entries(values).forEach(([column, value]) => this.eq(column, value));
    return this;
  }
  order(column, options = {}) { this.orderBy = { column, ascending: options.ascending !== false }; return this; }
  limit(count) { this.maxRows = Number(count); return this; }
  single() { this.singleResult = true; return this; }
  maybeSingle() { this.maybeSingleResult = true; return this; }

  async execute() {
    try {
      const { data: { session } = {} } = await client.auth.getSession();
      if (!session?.access_token) {
        return { data: null, error: { message: "Sign in to access portal data." } };
      }

      const response = await fetch("/api/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
        body: JSON.stringify({
          table: this.table,
          operation: this.operation,
          values: this.values,
          filters: this.filters,
          orderBy: this.orderBy,
          limit: this.maxRows,
          columns: this.columns,
          single: this.singleResult,
          maybeSingle: this.maybeSingleResult,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { data: null, error: { message: result.error || "Portal data request failed.", status: response.status } };
      }
      return { data: result.data ?? null, error: null, count: result.count ?? null };
    } catch (error) {
      return { data: null, error: { message: error?.message || "Portal data request failed." } };
    }
  }

  then(resolve, reject) { return this.execute().then(resolve, reject); }
  catch(reject) { return this.execute().catch(reject); }
  finally(callback) { return this.execute().finally(callback); }
}

export const supabase = new Proxy(client, {
  get(target, property, receiver) {
    if (property === "from") {
      return (table) => PROFILE_TABLES.has(table) ? target.from(table) : new ModuleQuery(table);
    }
    return Reflect.get(target, property, receiver);
  },
});
