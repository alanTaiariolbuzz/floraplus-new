"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { ToastProvider } from "@/app/(protected)/gestion-dinamica/nueva/components/ToastContext";
import AccountMenu from "@/components/ui/accountMenu";
import DashboardIcon from "@mui/icons-material/SpaceDashboard";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import BarChartIcon from "@mui/icons-material/BarChart";
import DescriptionIcon from "@mui/icons-material/Description";
import LayersIcon from "@mui/icons-material/Layers";
import CachedIcon from "@mui/icons-material/Cached";
import CalendarIcon from "@mui/icons-material/DateRange";
import StyleIcon from "@mui/icons-material/Style";

import SettingsIcon from "@mui/icons-material/Settings";
import AppsIcon from "@mui/icons-material/Apps";
import EmailIcon from "@mui/icons-material/Email";
import GroupsIcon from "@mui/icons-material/Groups";
import { CircularProgress, Typography } from "@mui/material";
const DRAWER_WIDTH = 240;

const menuItems = [
	{ icon: <DashboardIcon />, text: "Panel", path: "/admin/panel" },
	{
		icon: <StyleIcon />,
		text: "Reservas",
		path: "/admin/reservations",
	},
	{
		icon: <BarChartIcon />,
		text: "Reportes",
		path: "/admin/reports",
	},
	{
		icon: <GroupsIcon />,
		text: "Gestión de cuentas",
		path: "/admin/cuentas",
	},
	{
		icon: <SettingsIcon />,
		text: "Configuración",
		path: "/admin/configuracion",
	},
];

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const router = useRouter();
	// const { user, isLoading } = useUser();
	const { user, customUser, agency, isLoading } = useUser();

	const [isAuthorized, setIsAuthorized] = useState(false);

	useEffect(() => {
		if (!isLoading) {
			if (!user) {
				router.replace("/sign-in");
				return;
			}

			// Use customUser.rol_id instead of user.user_metadata.role
			const userRole = customUser?.rol_id === 1 ? "SUPER_ADMIN" : user.user_metadata?.role;
			if (userRole !== "SUPER_ADMIN") {
				router.replace("/dashboard");
				return;
			}

			setIsAuthorized(true);
		}
	}, [user, customUser, isLoading, router]);

	if (isLoading || !isAuthorized) {
		return (
			<>
				<div className="flex justify-center items-center h-screen">
					<CircularProgress />
				</div>
			</>
		);
	}

	return (
		<ToastProvider> 
			<div className="flex min-h-screen">
				{/* Header */}
				<header className="fixed w-full shadow-sm z-10">
					<div className="flex items-center justify-between px-4 h-16 bg-white border-b border-[#E0E0E0]">
						<h1 className="text-xl font-semibold ml-6">
							<img src="/images/flora-logo.svg" width={125} alt="Flora Plus" />
						</h1>

						<div className="text-sm  flex items-center gap-2 flex-row mr-8">
							{user && <AccountMenu user={user} />}
						</div>
					</div>
				</header>

				{/* Sidebar */}
				<aside className="fixed left-0 top-0 h-full w-[260px]  bg-white border-r border-[#E0E0E0]">
					<div className="h-16" /> {/* Spacer for header */}
					<nav className="overflow-auto mt-12 mx-3">
						<ul>
							{menuItems.map((item) => (
								<li key={item.path}>
									<button
										onClick={() => router.push(item.path)}
										className={`w-full rounded-[8px] flex flex-row items-center px-4 py-3 text-left text-base tracking-[0.15px] transition-colors ${pathname === item.path
												? "bg-[#f4792014] text-black font-normal"
												: "text-black font-normal hover:bg-[#f5f5f5]"
											}`}
									>
										<span
											className={`mr-5 ${pathname === item.path ? "text-[#f47920]" : "text-[#0000008a]"}`}
										>
											{item.icon}
										</span>
										{/* <p className="ml-3">{item.text}</p> */}
										<Typography
											variant="body1"
											color="black"
											sx={{ color: "rgba(0, 0, 0, 0.87)" }}
										>
											{item.text}
										</Typography>
									</button>
								</li>
							))}
						</ul>
					</nav>
				</aside>

				{/* Main content */}
				<main className="flex-1 ml-[260px] p-6 bg-[#FAFAFA] overflow-hidden ">
					<div className="h-16" /> {/* Spacer for header */}
					{children}
				</main>
			</div>
		</ToastProvider> 
	);
}
