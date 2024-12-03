"use client";
import React, { useMemo } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export function LoginButton() {
  const { data: session } = useSession();

  const handleSignin = async () => {
    if (session) {
      // User is signed in, sign them out
      signOut();
    } else {
      // User is not signed in, sign them in
  const idToken = useMemo(() => (session?.id_token || null), [session]);
      console.log(idToken); // Log the id_token for debugging

      const authorizeUser = await fetch("https://sandbox-api.okto.tech/api/v1/authorize", {
        method: 'POST',
        headers: {
          "X-Api-Key": process.env.AUTH_SECRET || '',
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientTokenId: idToken, // Pass the id_token in the request body
        }),
      });

      // Handle the response from the authorizeUser fetch
      const response = await authorizeUser.json();
      console.log("Authorization Response:", response);

      // Sign in with Google after authorization
      signIn("google");
    }
  };

  return (
    <div>
      <button
        className={`border rounded px-4 py-2 ${
          session ? "bg-red-500 text-white" : "bg-blue-500 text-white"
        }`}
        onClick={handleSignin}
      >
        {session ? "Log Out" : "Google Log In"}
      </button>
    </div>
  );
}

export function Button({children}: any) {

  return (
    <div>
      <button
        className={`border rounded px-4 py-2 bg-blue-500 text-white`}
      >
        {children}
      </button>
    </div>
  );
}



// export function LoginButton() {
//   const { data: session } = useSession();

//   const handleLogin = () => {
//     session ? signOut() : signIn();
//   };

//   return (
//     <button
//       className={`border border-transparent rounded px-4 py-2 transition-colors ${
//         session
//           ? "bg-red-500 hover:bg-red-700 text-white"
//           : "bg-blue-500 hover:bg-blue-700 text-white"
//       }`}
//       onClick={handleLogin}
//     >
//       Google {session ? "Log Out" : "Log In"}
//     </button>
//   );
// }
