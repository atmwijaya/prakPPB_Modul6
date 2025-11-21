import { supabase } from "../config/supabaseClient.js";

const TABLE = "sensor_readings";

function normalize(row) {
  if (!row) return row;
  return {
    ...row,
    temperature: row.temperature === null ? null : Number(row.temperature),
    threshold_value:
      row.threshold_value === null ? null : Number(row.threshold_value),
  };
}

export const ReadingsModel = {
  async list() {
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, temperature, threshold_value, recorded_at")
      .order("recorded_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data.map(normalize);
  },

  async listPaginated(page = 1, limit = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from(TABLE)
      .select("id, temperature, threshold_value, recorded_at", { count: 'exact' })
      .order("recorded_at", { ascending: false })
      .range(from, to);

    if (error) throw error;
    return {
      data: data.map(normalize),
      totalCount: count
    };
  },

  async latest() {
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, temperature, threshold_value, recorded_at")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return normalize(data);
  },

  async create(payload) {
    const { temperature, threshold_value } = payload;

    if (typeof temperature !== "number") {
      throw new Error("temperature must be a number");
    }

    const newRow = {
      temperature,
      threshold_value: threshold_value ?? null,
    };

    const { data, error } = await supabase
      .from(TABLE)
      .insert(newRow)
      .select("id, temperature, threshold_value, recorded_at")
      .single();

    if (error) throw error;
    return normalize(data);
  },

  async getTotalCount() {
    const { count, error } = await supabase
      .from(TABLE)
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count;
  }
};