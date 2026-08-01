"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";


export default function EditSalaryPage() {


  const { id } = useParams();
  const router = useRouter();


  const [month, setMonth] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");



  const getSalary = async () => {


    const { data, error } = await supabase
      .from("salary")
      .select("*")
      .eq("id", id)
      .single();



    if(error){
      console.log(error);
      return;
    }


    setMonth(data.month);
    setAmount(data.amount);
    setPaymentMethod(data.payment_method);


  };



  useEffect(()=>{

    if(id){
      getSalary();
    }

  },[id]);




  const updateSalary = async(e)=>{

    e.preventDefault();


    const {error} = await supabase
      .from("salary")
      .update({

        month,
        amount,
        payment_method: paymentMethod

      })
      .eq("id",id);



    if(error){

      alert(error.message);
      return;

    }


    alert("Salary Updated Successfully");


    router.push("/dashboard/salary/history");


  };




  return (

    <div>

      <h1 className="mb-6 text-3xl font-bold text-blue-600">
        Edit Salary
      </h1>



      <form
        onSubmit={updateSalary}
        className="max-w-xl rounded-xl bg-white p-6 shadow"
      >


        <label className="mb-2 block text-black">
          Salary Month
        </label>


        <input

          type="month"

          value={month}

          onChange={(e)=>setMonth(e.target.value)}

          className="mb-4 w-full rounded-lg border p-3 text-black"

        />




        <label className="mb-2 block text-black">
          Salary Amount
        </label>


        <input

          type="number"

          value={amount}

          onChange={(e)=>setAmount(e.target.value)}

          className="mb-4 w-full rounded-lg border p-3 text-black"

        />




        <label className="mb-2 block text-black">
          Payment Method
        </label>


        <select

          value={paymentMethod}

          onChange={(e)=>setPaymentMethod(e.target.value)}

          className="mb-6 w-full rounded-lg border p-3 text-black"

        >

          <option>Cash</option>

          <option>Bank</option>


        </select>




        <button

          className="w-full rounded-lg bg-blue-600 p-3 text-white"

        >

          Update Salary

        </button>



      </form>


    </div>

  );


}