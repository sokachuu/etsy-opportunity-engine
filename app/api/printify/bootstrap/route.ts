import {NextResponse} from "next/server";
import {getBlueprints,getProviders,getVariants,listShops} from "../../../../lib/printify.mjs";

export async function GET() {
  if (!process.env.PRINTIFY_API_TOKEN) {
    return NextResponse.json({connected:false,message:"PRINTIFY_API_TOKEN is not configured."});
  }

  try {
    const shops = await listShops();
    const blueprintList = await getBlueprints();
    const blueprint = (blueprintList || []).find((x) =>
      /gildan/i.test(String(x.brand)) && /5000/.test(String(x.model))
    );

    if (!blueprint) {
      return NextResponse.json({
        connected:true,
        shops,
        blueprint:null,
        providers:[],
        variants:[],
        message:"Gildan 5000 was not found in the current Printify catalog."
      });
    }

    const providers = await getProviders(blueprint.id);
    const preferred = (providers || []).find((x) => /printify choice/i.test(String(x.title))) || providers?.[0];
    const variants = preferred ? await getVariants(blueprint.id, preferred.id) : [];

    return NextResponse.json({
      connected:true,
      shops,
      blueprint,
      provider:preferred || null,
      providers,
      variants
    });
  } catch (error) {
    return NextResponse.json({
      connected:false,
      message:error instanceof Error ? error.message : "Printify bootstrap failed"
    }, {status:502});
  }
}
