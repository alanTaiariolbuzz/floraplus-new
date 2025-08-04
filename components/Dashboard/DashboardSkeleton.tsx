import { Container, Grid, Skeleton, Box } from "@mui/material";

const DashboardSkeleton = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4, minHeight: "100vh" }}>
      {/* Date Header Skeleton */}
      <Skeleton variant="text" width={200} height={40} />

      <div className="flex flex-col lg:flex-row gap-4 mt-4">
        {/* Main Section (60% width) */}
        <div className="w-full lg:w-[60%]">
          <Box sx={{ height: 400, width: "100%" }}>
            <Skeleton variant="rectangular" height="100%" />
          </Box>
        </div>

        {/* Secondary Section (40% width) */}
        <div className="w-full lg:w-[40%] border border-[#eaeaea] rounded-[8px]">
          <Grid container>
            <Grid item xs={12}>
              {/* Tabs Skeleton */}
              <Box sx={{ p: 2 }}>
                <Skeleton variant="text" width="60%" height={40} />
                <Box sx={{ mt: 2 }}>
                  <Skeleton variant="rectangular" height={200} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </div>
      </div>

      {/* Schedule Section Skeleton */}
      <Grid item xs={12} sx={{ mt: 4 }}>
        <Box sx={{ p: 2, border: "1px solid #eaeaea", borderRadius: "8px" }}>
          <Skeleton variant="text" width="40%" height={40} />
          <Box sx={{ mt: 2 }}>
            <Skeleton variant="rectangular" height={300} />
          </Box>
        </Box>
      </Grid>
    </Container>
  );
};

export default DashboardSkeleton;
