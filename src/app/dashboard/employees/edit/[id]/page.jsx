"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { dbFetch, dbSaveRecord } from "@/lib/dbPersistence";
import { useParams, useRouter } from "next/navigation";



export default function EditEmployee(){
  const { id } = useParams();
  const router = useRouter();

  const [form,setForm] = useState({
    full_name:"",
    father_name:"",
    phone:"",
    email:"",
    address:"",
    department:"",
    designation:"",
    joining_date:"",
    status:""
  });

  const getEmployee = async()=>{
    const all = await dbFetch("employees");
    const found = all.find(e => String(e.id) === String(id) || String(e.email).toLowerCase() === String(id).toLowerCase());
    if(found){
      setForm(found);
    }
  };

  useEffect(()=>{
    if(id){
      getEmployee();
    }
  },[id]);

  const handleChange=(e)=>{
    setForm({
      ...form,
      [e.target.name]:e.target.value
    });
  };

  const updateEmployee=async(e)=>{
    e.preventDefault();
    await dbSaveRecord("employees", form);
    alert("Employee Updated");
    router.push("/dashboard/employees");
  };



  return(

    <div>

      <h1 className="mb-6 text-3xl font-bold text-blue-600">
        Edit Employee
      </h1>



      <form
        onSubmit={updateEmployee}
        className="grid gap-4 rounded-xl text-black p-6 shadow-sm sm:grid-cols-2"
      >


      {
        Object.keys(form).map((field)=>(

          <input

            key={field}

            name={field}

            value={form[field] || ""}

            onChange={handleChange}

            placeholder={field.replace("_"," ").toUpperCase()}

            className="rounded-lg border text-black border-blue-200 p-3 outline-none focus:border-blue-600"

          />

        ))
      }



      <button
        className="rounded-lg bg-blue-600 p-3 text-black hover:bg-blue-700 sm:col-span-2"
      >

        Update Employee

      </button>


      </form>


    </div>

  );

}