import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kchyehciyubouojzzuih.supabase.co';
const supabaseKey = 'sb_publishable_9Nqf4MIfCB9hUocKFwV6dQ_a39nPq76';

export const supabase = createClient(supabaseUrl, supabaseKey);