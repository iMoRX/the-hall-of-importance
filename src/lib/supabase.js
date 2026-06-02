import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qgzumforwvxuyivgvxwr.supabase.co';
const supabaseAnonKey = 'sb_publishable_cKK2oHxYc8_g7ghQPxZ_yQ_jANYr3jU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
