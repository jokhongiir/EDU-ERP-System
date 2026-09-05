import { supabase } from "./supabaseClient";

export const registerUser = async (centerName, email, password) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { centerName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) return { error: error.message };

    const user = data.user;
    if (!user) return { error: "User yaratilmadi" };

    const { error: insertError } = await supabase.from("users").upsert([
      {
        full_name: centerName,
        email,
        role: "admin",
        owner_uid: user.id,
      },
    ]);

    if (insertError) return { error: insertError.message };

    // Agar email confirm o'chirilgan bo'lsa, session bo'lishi mumkin
    // Yo'q bo'lsa login qilamiz
    if (!data.session) {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginError) return { error: loginError.message };
    }

    return { user };
  } catch (err) {
    return { error: err.message };
  }
};

export const loginUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { error: "Email yoki parol noto‘g‘ri" };
  // Session avtomatik localStorage ga yoziladi
  return { user: data.user, session: data.session };
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) return { error: error.message };
  return { success: true };
};

export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
};