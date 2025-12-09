import { Card, CardContent, CardHeader } from "../ui/card"

const ProfileSkeleton = () => {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                <Card className="border-0 shadow-none">
                    <CardHeader>
                        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                        ))}
                    </CardContent>
                </Card>

                <Card className="shadow-none border-0">
                    <CardHeader>
                        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-56 bg-muted rounded animate-pulse" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-10 w-48 bg-muted rounded animate-pulse" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default ProfileSkeleton;