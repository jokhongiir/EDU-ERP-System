import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import "./CreateBranch.css";

export default function CreateBranch() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const createBranch = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return navigate("/");

    const { error } = await supabase
      .from("branches")
      .insert([{ name, owner_uid: user.id }]);
    if (!error) navigate(`/dashboard/${user.id}`);
  };

  return (
    <div className="branch-container">
      <div className="branch-box">
        <h2>Create Your Branch</h2>
        <input
          placeholder="Branch Name (e.g. Chilonzor филиал)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={createBranch}>Create</button>
      </div>
    </div>
  );
}
