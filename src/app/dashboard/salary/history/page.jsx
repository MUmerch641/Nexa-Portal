"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const deleteSalary = async (id) => {

  const confirmDelete = confirm(
    "Are you sure you want to delete this salary?"
  );


  if(!confirmDelete){
    return;
  }


  const { error } = await supabase
    .from("salary")
    .delete()
    .eq("id", id);



  if(error){

    alert(error.message);
    return;

  }


  alert("Salary Deleted Successfully");


  getSalaryHistory();

};

export default function SalaryHistoryPage() {

  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);


  const getSalaryHistory = async () => {

    const { data, error } = await supabase
      .from("salary")
      .select(`
        id,
        month,
        amount,
        payment_method,
        payment_date,
        employees(
          full_name
        )
      `)
      .order("payment_date", { ascending: false });


    if(error){
      console.log(error);
      return;
    }


    setSalaries(data);
    setLoading(false);

  };


  useEffect(() => {
    getSalaryHistory();
  }, []);



  if(loading){
    return (
      <div className="p-10 text-xl text-black">
        Loading Salary Records...
      </div>
    );
  }



  return (

    <div>

      <h1 className="mb-6 text-3xl font-bold text-blue-600">
        Salary History
      </h1>


      <div className="overflow-x-auto rounded-xl bg-white shadow">

        <table className="w-full">

          <thead className="bg-blue-600 text-white">

            <tr>

              <th className="p-3 text-left">
                Employee
              </th>

              <th className="p-3 text-left">
                Month
              </th>

              <th className="p-3 text-left">
                Amount
              </th>

              <th className="p-3 text-left">
                Payment
              </th>

              <th className="p-3 text-left">
                Date
              </th>

              <th className="p-3 text-left">
  Action
</th>

            </tr>

          </thead>



          <tbody>


          {
            salaries.length === 0 ? (

              <tr>
                <td 
                  colSpan="5"
                  className="p-5 text-center text-gray-500"
                >
                  No Salary Records Found
                </td>
              </tr>

            ) : (

              salaries.map((salary)=>(

                <tr 
                  key={salary.id}
                  className="border-b"
                >

                  <td className="p-3 text-black">
                    {salary.employees?.full_name}
                  </td>


                  <td className="p-3 text-black">
                    {salary.month}
                  </td>


                  <td className="p-3 text-black">
                    Rs {salary.amount}
                  </td>


                  <td className="p-3 text-black">
                    {salary.payment_method}
                  </td>


                  <td className="p-3 text-black">
                    {salary.payment_date}
                  </td>

                  <td className="p-3">


<Link
 href={`/dashboard/salary/edit/${salary.id}`}
 className="rounded bg-blue-600 px-4 py-2 text-white"
>
 Edit
</Link>

<button
 onClick={()=>deleteSalary(salary.id)}
 className="ml-2 rounded bg-red-600 px-4 py-2 text-white"
>
 Delete
</button>



</td>


                </tr>

              ))

            )
          }


          </tbody>


        </table>


      </div>


    </div>

  );

}