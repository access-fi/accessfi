'use client'

import { useState } from 'react'
import { initZkEmailSdk, Proof } from "@zk-email/sdk";

export default function Home() {
  const [proof, setProof] = useState<Proof | null>(null);
  const [loading, setLoading] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      // Read the file as text
      const eml = await file.text()

      // DEBUG: Extract and log the actual subject
      const headers = eml.split('\n\n')[0]; // Get only email headers
      const subjectMatch = headers.match(/^Subject: (.+)$/m);
      console.log('📧 Extracted Subject:', subjectMatch ? subjectMatch[1] : 'NOT FOUND');
      console.log('📧 Full Headers:', headers);

      // Initialize the SDK
      const sdk = initZkEmailSdk();

      // Get the blueprint
      const blueprint = await sdk.getBlueprint("access-fi/accessfi2_1@v7") //access-fi/accessfi@v7

      console.log("Blueprint:", blueprint);

      // Create a prover
      const prover = blueprint.createProver()
      console.log("Prover:", prover);
      // Generate the proof
      const proof = await prover.generateProof(eml);
      console.log("Proof:", proof);
      setProof(proof);

      // Verify the proof on chain
      const verification = await blueprint.verifyProofOnChain(proof);

      // Verify the proof off chain
    //   const verification = await blueprint.verifyProof(proof);

      console.log("Verification:", verification);
    } catch (error) {
      console.error("Error generating proof:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <div>
        <h1>ZK Email Proof Generator</h1>
        
        <input 
          type="file" 
          accept=".eml"
          onChange={handleFileUpload}
          disabled={loading}
        />
        
        {loading && <p>Generating proof...</p>}
        
        {proof && (
          <div>
            <h3>Proof Generated:</h3>
            <pre>
              {JSON.stringify(proof, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  )
}