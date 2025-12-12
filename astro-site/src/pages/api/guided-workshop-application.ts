import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const startingFresh = formData.get('startingFresh');
    
    // Check honeypot field (spam prevention)
    const honeypot = formData.get('company');
    if (honeypot && String(honeypot).trim() !== '') {
      // Silently reject spam
      return new Response(null, {
        status: 303,
        headers: {
          Location: "/guided-workshop/thanks",
        },
      });
    }
    
    // Server-side validation: startingFresh must be "yes"
    if (startingFresh !== "yes") {
      return new Response(null, {
        status: 303,
        headers: {
          Location: "/guided-workshops/apply?error=not-fresh",
        },
      });
    }
    
    // Log the application (to be wired up later)
    const applicationData = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      projectDirection: formData.get('projectDirection'),
      startingFresh: formData.get('startingFresh'),
      machineModel: formData.get('machineModel'),
      machineComfortLevel: formData.get('machineComfortLevel'),
      experienceLevel: formData.get('experienceLevel'),
      patternStatus: formData.get('patternStatus'),
      patternReference: formData.get('patternReference'),
      yarnStatus: formData.get('yarnStatus'),
      startWindow: formData.get('startWindow'),
      confirm: formData.get('confirm'),
      submittedAt: new Date().toISOString(),
    };
    
    console.log("Guided Workshop Application received:", applicationData);
    
    // Redirect to dedicated thanks page
    return new Response(null, {
      status: 303,
      headers: {
        Location: "/guided-workshop/thanks",
      },
    });
  } catch (error: any) {
    console.error("Error processing guided workshop application:", error);
    return new Response(null, {
      status: 303,
      headers: {
        Location: "/guided-workshops/apply?error=server",
      },
    });
  }
};
