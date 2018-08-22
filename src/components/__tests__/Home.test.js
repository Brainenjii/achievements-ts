import React from "react";
import { Home } from "../Home";
import { createShallow } from "@material-ui/core/test-utils";

describe("<Home>", () => {
  let shallow;
  beforeEach(() => {
    shallow = createShallow();
  });

  it("Should test Home component", () => {
    const component = shallow(<Home />);
    expect(component.text()).toBe("This is the home route");
  });
});
