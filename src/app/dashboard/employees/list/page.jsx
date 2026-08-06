"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { dbFetch, dbDeleteRecord } from "@/lib/dbPersistence";
import Link from "next/link";


export default function EmployeeList() {

  const [employees, setEmployees] = useState([]);


  const getEmployees = async () => {
    const data = await dbFetch("employees");
    setEmployees(data);
  };



  useEffect(()=>{

    getEmployees();

  },[]);



  const deleteEmployee = async(id)=>{
    const confirmDelete = confirm(
      "Delete this employee?"
    );

    if(!confirmDelete) return;

    await dbDeleteRecord("employees", id);
    getEmployees();
  };




  return (

    <div>


      <h1 className="mb-6 text-3xl font-bold text-blue-600">
        Employees
      </h1>



      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">

        <table className="w-full">

          <thead className="bg-blue-600 text-white">

            <tr>

              <th className="p-3 text-left">
                Name
              </th>

              <th className="p-3 text-left">
                Department
              </th>

              <th className="p-3 text-left">
                Designation
              </th>

              <th className="p-3 text-left">
                Status
              </th>

              <th className="p-3">
                Action
              </th>

            </tr>

          </thead>


          <tbody>


          {
            employees.map((emp)=>(

              <tr
                key={emp.id}
                className="border-b"
              >

                <td className="p-3">
                  {emp.full_name}
                </td>


                <td className="p-3">
                  {emp.department}
                </td>


                <td className="p-3">
                  {emp.designation}
                </td>


                <td className="p-3 text-blue-600">
                  {emp.status}
                </td>


                <td className="p-3">

                  <button

                    onClick={()=>deleteEmployee(emp.id)}

                    className="rounded-lg bg-blue-600 px-4 py-2 text-black hover:bg-blue-700"

                  >
                    Delete
                  </button>
                  <Link
href={`/dashboard/employees/edit/${emp.id}`}
className="mr-2 rounded-lg bg-blue-600 px-4 py-2 text-white"
>
Edit
</Link>

                </td>


              </tr>

            ))
          }


          </tbody>


        </table>


      </div>


    </div>

  );

}