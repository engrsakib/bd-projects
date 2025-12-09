import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/common/container"

interface Outlet {
  _id: string
  name: string
  slug: string
  location: {
    latitude: number
    longitude: number
    _id: string
  }
  address: {
    division: string
    district: string
    thana: string
    local_address: string
    _id: string
  }
  type: string
  createdAt: string
  updatedAt: string
  __v: number
}

interface OutletsData {
  statusCode: number
  success: boolean
  message: string
  data: {
    outlets: Outlet[]
    total: number
    page: number
    totalPages: number
  }
}


export default function OutletsSection({data} : {data : OutletsData}) {
  const outlets = data.data.outlets

  return (
    <section lang="bn" className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <Container className=" mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-secondary">
            আমাদের আউটলেটসমূহ
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl">আপনার নিকটস্থ আমাদের আউটলেটগুলি খুঁজে নিন।</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {outlets.map((outlet) => (
            <Card key={outlet._id} className="flex flex-col justify-between shadow-none rounded-md border border-primary/60">
              <CardHeader>
                <CardTitle className="text-secondary text-center">{outlet.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-secondary mb-2">ঠিকানা:</h3>
                <p className="text-muted-foreground text-sm">
                  {outlet.address.local_address}, {outlet.address.thana}, {outlet.address.district},{" "}
                  {outlet.address.division}
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button asChild className="w-full bg-primary text-white hover:bg-primary/90">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${outlet.location.latitude}%2C${outlet.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ম্যাপে দেখুন
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}
