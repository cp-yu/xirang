export function generateSpecification(): string {
  return `specification {
  element project {
    style {
      shape rectangle
      color gray
    }
  }

  element domain {
    style {
      shape rectangle
      color indigo
    }
  }

  element capability {
    style {
      shape rectangle
      color blue
    }
  }

  relationship invokes
  relationship consumes
  relationship precedes
  relationship constrains
  relationship validates
}
`;
}
