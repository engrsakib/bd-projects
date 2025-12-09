import api from "./api-query";

const userQuery = api.injectEndpoints({
    endpoints: (builder) => ({

        updateUserProfile: builder.mutation({
            query: (body) => ({
                url: "/user/self",
                method: "PATCH",
                credentials: "include",
                body,
            }),
            invalidatesTags: ["User"],
        }),
        changePassword: builder.mutation({
            query: (body) => ({
                url: "/user/change-password",
                method: "POST",
                credentials: "include",
                body,
            }),
        }),
    }),
});

export const {
    useUpdateUserProfileMutation,
    useChangePasswordMutation,
} = userQuery;

export default userQuery;
